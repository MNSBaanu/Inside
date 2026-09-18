import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  NotificationType,
  Prisma,
  ProposalStatus,
  ProjectStatus,
  RequestStatus,
  RequestType,
  Role,
  StageName,
} from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { ActivityService } from '../activity/activity.service';
import { BlocksService } from '../blocks/blocks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

const STAGE_ORDER: StageName[] = [
  StageName.PROPOSAL,
  StageName.CONCEPT,
  StageName.DESIGN,
  StageName.REVISION,
  StageName.COMPLETION,
];

const proposalInclude = {
  designer: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      isVerified: true,
      isAvailable: true,
    },
  },
} as const;

@Injectable()
export class ProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    private readonly blocks: BlocksService,
  ) {}

  async create(user: AuthUser, requestId: string, dto: CreateProposalDto) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    this.assertCanPropose(user, request);
    await this.blocks.assertNotBlocked(user.id, request.clientId);

    const stageNames = new Set(dto.stageFees.map((s) => s.name));
    if (stageNames.size !== dto.stageFees.length) {
      throw new BadRequestException('Each stage can only have one fee');
    }

    const totalCents = dto.stageFees.reduce(
      (sum, s) => sum + Math.round(s.fee * 100),
      0,
    );
    const totalAmount = totalCents / 100;
    const terms = {
      scope: dto.scope,
      timeline: dto.timeline,
      stageFees: JSON.parse(
        JSON.stringify(dto.stageFees),
      ) as Prisma.InputJsonValue,
      totalAmount,
    };

    const previous = await this.prisma.proposal.findUnique({
      where: { requestId_designerId: { requestId, designerId: user.id } },
    });
    const canResubmit =
      previous?.status === ProposalStatus.WITHDRAWN ||
      previous?.status === ProposalStatus.REJECTED;

    try {
      const proposal = canResubmit
        ? await this.prisma.proposal.update({
            where: { id: previous.id },
            data: {
              ...terms,
              status: ProposalStatus.PENDING,
              submittedAt: new Date(),
            },
            include: proposalInclude,
          })
        : await this.prisma.proposal.create({
            data: { requestId, designerId: user.id, ...terms },
            include: proposalInclude,
          });

      await this.notifications.notify({
        userId: request.clientId,
        type: NotificationType.PROPOSAL,
        title: 'New proposal',
        message: `${user.name} sent a proposal for "${request.title}"`,
        metadata: { requestId, proposalId: proposal.id },
      });

      return {
        success: true,
        data: { proposal: this.serialize(proposal) },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You already submitted a proposal for this request',
        );
      }
      throw error;
    }
  }

  async listByRequestId(user: AuthUser, requestId: string) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    this.assertCanViewProposals(user, request);

    const isClient = request.clientId === user.id;
    const items = await this.prisma.proposal.findMany({
      where: { requestId, ...(isClient ? {} : { designerId: user.id }) },
      orderBy: { submittedAt: 'desc' },
      include: proposalInclude,
    });

    return {
      success: true,
      data: { items: items.map((p) => this.serialize(p)) },
    };
  }

  async withdraw(user: AuthUser, id: string) {
    const proposal = await this.requireDesignerProposal(id, user.id);
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Only pending proposals can be withdrawn');
    }

    const updated = await this.prisma.proposal.update({
      where: { id },
      data: { status: ProposalStatus.WITHDRAWN },
      include: proposalInclude,
    });

    await this.notifications.notify({
      userId: proposal.request.clientId,
      type: NotificationType.PROPOSAL,
      title: 'Proposal withdrawn',
      message: `${user.name} withdrew their proposal for "${proposal.request.title}"`,
      metadata: { requestId: proposal.requestId, proposalId: id },
    });

    return { success: true, data: { proposal: this.serialize(updated) } };
  }

  async reject(user: AuthUser, id: string) {
    const proposal = await this.requireClientProposal(id, user.id);
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Only pending proposals can be rejected');
    }

    const updated = await this.prisma.proposal.update({
      where: { id },
      data: { status: ProposalStatus.REJECTED },
      include: proposalInclude,
    });

    await this.notifications.notify({
      userId: proposal.designerId,
      type: NotificationType.PROPOSAL,
      title: 'Proposal declined',
      message: `Your proposal for "${proposal.request.title}" was declined`,
      metadata: { requestId: proposal.requestId, proposalId: id },
    });

    return { success: true, data: { proposal: this.serialize(updated) } };
  }

  async accept(user: AuthUser, id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { request: true, designer: { select: { status: true } } },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.request.clientId !== user.id) {
      throw new ForbiddenException('You do not own this request');
    }
    if (proposal.designerId === user.id) {
      throw new ForbiddenException('You cannot accept your own proposal');
    }
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Only pending proposals can be accepted');
    }
    if (proposal.designer.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('This designer is no longer available');
    }
    await this.blocks.assertNotBlocked(user.id, proposal.designerId);
    if (
      proposal.request.status !== RequestStatus.OPEN &&
      proposal.request.status !== RequestStatus.PENDING
    ) {
      throw new BadRequestException('Request is not accepting proposals');
    }

    const stageFees = this.parseStageFees(proposal.stageFees);
    const feeMap = new Map(stageFees.map((s) => [s.name, s.fee]));

    const stageDays = this.stageDays(proposal.timeline);
    let declinedDesignerIds: string[] = [];
    const project = await this.prisma.$transaction(async (tx) => {
      // Claim the request row first: a concurrent accept then waits here and
      // fails cleanly, instead of deadlocking on the proposal rows.
      const requestClaimed = await tx.projectRequest.updateMany({
        where: {
          id: proposal.requestId,
          status: { in: [RequestStatus.OPEN, RequestStatus.PENDING] },
        },
        data: {
          status: RequestStatus.ACCEPTED,
          designerId: proposal.designerId,
        },
      });
      const claimed = await tx.proposal.updateMany({
        where: { id, status: ProposalStatus.PENDING },
        data: { status: ProposalStatus.ACCEPTED },
      });
      if (claimed.count === 0 || requestClaimed.count === 0) {
        throw new ConflictException(
          'This proposal or request has already been decided',
        );
      }

      const others = await tx.proposal.findMany({
        where: {
          requestId: proposal.requestId,
          id: { not: id },
          status: ProposalStatus.PENDING,
        },
        select: { designerId: true },
      });
      declinedDesignerIds = others.map((p) => p.designerId);

      await tx.proposal.updateMany({
        where: {
          requestId: proposal.requestId,
          id: { not: id },
          status: ProposalStatus.PENDING,
        },
        data: { status: ProposalStatus.REJECTED },
      });

      return tx.project.create({
        data: {
          proposalId: proposal.id,
          clientId: proposal.request.clientId,
          designerId: proposal.designerId,
          title: proposal.request.title,
          currentStage: StageName.PROPOSAL,
          status: ProjectStatus.ACTIVE,
          startedAt: new Date(),
          stages: {
            create: STAGE_ORDER.map((name, index) => ({
              stageOrder: index + 1,
              name,
              fee: feeMap.get(name) ?? null,
              dueDate: new Date(
                Date.now() + (index + 1) * stageDays * 24 * 60 * 60 * 1000,
              ),
            })),
          },
        },
        include: {
          stages: { orderBy: { stageOrder: 'asc' } },
        },
      });
    });

    await this.notifications.notify({
      userId: proposal.designerId,
      type: NotificationType.PROPOSAL,
      title: 'Proposal accepted',
      message: `Your proposal for "${proposal.request.title}" was accepted`,
      metadata: { projectId: project.id, proposalId: proposal.id },
    });

    await this.activity.log({
      projectId: project.id,
      userId: user.id,
      action: 'PROPOSAL_ACCEPTED',
      metadata: { proposalId: proposal.id, requestId: proposal.requestId },
    });

    await Promise.all(
      declinedDesignerIds.map((designerId) =>
        this.notifications.notify({
          userId: designerId,
          type: NotificationType.PROPOSAL,
          title: 'Proposal declined',
          message: `The client chose another proposal for "${proposal.request.title}"`,
          metadata: { requestId: proposal.requestId },
        }),
      ),
    );

    return {
      success: true,
      data: { project: this.serializeProject(project) },
    };
  }

  private assertCanPropose(
    user: AuthUser,
    request: {
      clientId: string;
      type: RequestType;
      status: RequestStatus;
      designerId: string | null;
    },
  ) {
    if (request.clientId === user.id) {
      throw new ForbiddenException('You cannot propose on your own request');
    }

    if (request.type === RequestType.DIRECT) {
      if (request.designerId !== user.id) {
        throw new ForbiddenException(
          'This direct request is not assigned to you',
        );
      }
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Request is not awaiting a proposal');
      }
      return;
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Request is not open for proposals');
    }
  }

  private assertCanViewProposals(
    user: AuthUser,
    request: {
      clientId: string;
      designerId: string | null;
      type: RequestType;
      status: RequestStatus;
    },
  ) {
    const isClient = request.clientId === user.id;
    const isAssignedDesigner = request.designerId === user.id;
    const isOpenDesigner =
      user.activeRole === Role.DESIGNER &&
      request.type === RequestType.OPEN &&
      (request.status === RequestStatus.OPEN ||
        request.status === RequestStatus.ACCEPTED);

    if (!isClient && !isAssignedDesigner && !isOpenDesigner) {
      throw new ForbiddenException('You do not have access to these proposals');
    }
  }

  private async requireDesignerProposal(id: string, designerId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        ...proposalInclude,
        request: { select: { clientId: true, title: true } },
      },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.designerId !== designerId) {
      throw new ForbiddenException('You do not own this proposal');
    }
    return proposal;
  }

  private async requireClientProposal(id: string, clientId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { request: true, ...proposalInclude },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.request.clientId !== clientId) {
      throw new ForbiddenException('You do not own this request');
    }
    return proposal;
  }

  /** Spreads a proposal timeline such as "6 weeks" across the stages. */
  private stageDays(timeline: string) {
    const match = /(\d+(?:\.\d+)?)\s*(day|week|month)/i.exec(timeline);
    if (!match) return 14;
    const perUnit: Record<string, number> = { day: 1, week: 7, month: 30 };
    const total = Number(match[1]) * perUnit[match[2].toLowerCase()];
    return Math.max(1, Math.round(total / STAGE_ORDER.length));
  }

  private parseStageFees(raw: unknown): { name: StageName; fee: number }[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((item) => {
        if (
          item &&
          typeof item === 'object' &&
          'name' in item &&
          'fee' in item
        ) {
          return {
            name: (item as { name: StageName }).name,
            fee: Number((item as { fee: unknown }).fee),
          };
        }
        return null;
      })
      .filter(
        (item): item is { name: StageName; fee: number } => item !== null,
      );
  }

  private serialize(proposal: {
    id: string;
    requestId: string;
    designerId: string;
    scope: string;
    timeline: string;
    stageFees: unknown;
    totalAmount: unknown;
    status: ProposalStatus;
    submittedAt: Date;
    updatedAt: Date;
    designer?: {
      id: string;
      name: string;
      avatarUrl: string | null;
      isVerified: boolean;
      isAvailable: boolean;
    };
  }) {
    return {
      id: proposal.id,
      requestId: proposal.requestId,
      designerId: proposal.designerId,
      scope: proposal.scope,
      timeline: proposal.timeline,
      stageFees: proposal.stageFees,
      totalAmount:
        proposal.totalAmount !== null ? Number(proposal.totalAmount) : null,
      status: proposal.status,
      submittedAt: proposal.submittedAt,
      updatedAt: proposal.updatedAt,
      designer: proposal.designer ?? null,
    };
  }

  private serializeProject(project: {
    id: string;
    proposalId: string;
    clientId: string;
    designerId: string;
    title: string;
    currentStage: StageName;
    status: ProjectStatus;
    startedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    stages: {
      id: string;
      stageOrder: number;
      name: StageName;
      status: string;
      fee: unknown;
      dueDate: Date | null;
    }[];
  }) {
    return {
      id: project.id,
      proposalId: project.proposalId,
      clientId: project.clientId,
      designerId: project.designerId,
      title: project.title,
      currentStage: project.currentStage,
      status: project.status,
      startedAt: project.startedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stages: project.stages.map((s) => ({
        id: s.id,
        stageOrder: s.stageOrder,
        name: s.name,
        status: s.status,
        fee: s.fee !== null ? Number(s.fee) : null,
        dueDate: s.dueDate,
      })),
    };
  }
}
