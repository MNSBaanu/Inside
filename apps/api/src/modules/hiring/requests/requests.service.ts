import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  MoodboardStatus,
  NotificationType,
  Prisma,
  ProposalStatus,
  RequestStatus,
  RequestType,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { BlocksService } from '../../trust/blocks/blocks.service';
import {
  PaginationQueryDto,
  paginate,
} from '../../../common/dto/pagination-query.dto';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { likedImages } from '../../../common/moodboard';
import { CreateRequestDto } from './dto/create-request.dto';
import { ReviewMoodboardDto } from './dto/review-moodboard.dto';
import type { ListOpenRequestsQueryDto } from './dto/list-open-requests-query.dto';

const briefSelect = {
  id: true,
  styles: true,
  rooms: true,
  budgetRange: true,
  description: true,
  moodboard: {
    select: {
      id: true,
      name: true,
      moodWords: true,
      palette: true,
      savedItems: true,
    },
  },
} as const;

type BriefRow = {
  id: string;
  styles: string[];
  rooms: string[];
  budgetRange: string | null;
  description: string | null;
  moodboard: {
    id: string;
    name: string;
    moodWords: string[];
    palette: string[];
    savedItems: unknown;
  } | null;
};

/** What a designer sees of the client's brief. Stored on the request when it is sent. */
function briefView(brief: BriefRow) {
  return {
    id: brief.id,
    styles: brief.styles,
    rooms: brief.rooms,
    budgetRange: brief.budgetRange,
    description: brief.description,
    moodboard: brief.moodboard
      ? {
          id: brief.moodboard.id,
          name: brief.moodboard.name,
          moodWords: brief.moodboard.moodWords,
          palette: brief.moodboard.palette,
          images: likedImages(brief.moodboard.savedItems),
        }
      : null,
  };
}

type BriefView = ReturnType<typeof briefView>;

const requestInclude = {
  brief: { select: briefSelect },
  portfolio: {
    select: {
      id: true,
      title: true,
      images: {
        select: { imageUrl: true },
        orderBy: { displayOrder: 'asc' },
        take: 1,
      },
    },
  },
  designer: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      isVerified: true,
      isAvailable: true,
    },
  },
  client: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { proposals: true } },
} as const;

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthUser, dto: CreateRequestDto) {
    if (dto.type === RequestType.DIRECT) {
      if (!dto.designerId) {
        throw new BadRequestException(
          'designerId is required for DIRECT requests',
        );
      }
      if (dto.designerId === user.id) {
        throw new BadRequestException(
          'Cannot send a direct request to yourself',
        );
      }
      const designer = await this.prisma.user.findUnique({
        where: { id: dto.designerId },
      });
      if (
        !designer ||
        designer.role !== Role.DESIGNER ||
        designer.status !== AccountStatus.ACTIVE
      ) {
        throw new NotFoundException('Designer not found');
      }
      if (!designer.isAvailable) {
        throw new BadRequestException(
          'This designer is not taking new requests. Please choose an available designer.',
        );
      }
      await this.blocks.assertNotBlocked(user.id, dto.designerId);
    } else if (dto.designerId || dto.portfolioId) {
      throw new BadRequestException(
        'OPEN requests must not include designerId or portfolioId',
      );
    }

    if (dto.portfolioId) {
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { id: dto.portfolioId },
        select: { designerId: true, isPublished: true },
      });
      if (
        !portfolio ||
        !portfolio.isPublished ||
        portfolio.designerId !== dto.designerId
      ) {
        throw new NotFoundException('Portfolio project not found');
      }
    }

    let briefSnapshot: BriefView | undefined;
    if (dto.briefId) {
      const brief = await this.prisma.brief.findUnique({
        where: { id: dto.briefId },
        select: { ...briefSelect, clientId: true },
      });
      if (!brief || brief.clientId !== user.id) {
        throw new NotFoundException('Brief not found');
      }
      briefSnapshot = briefView(brief);
    }

    const request = await this.prisma.projectRequest.create({
      data: {
        clientId: user.id,
        designerId: dto.type === RequestType.DIRECT ? dto.designerId : null,
        briefId: dto.briefId,
        briefSnapshot,
        portfolioId: dto.portfolioId,
        title: dto.title,
        description: dto.description,
        timeline: dto.timeline,
        type: dto.type,
        status:
          dto.type === RequestType.DIRECT
            ? RequestStatus.PENDING
            : RequestStatus.OPEN,
        budget: dto.budget,
      },
      include: requestInclude,
    });

    if (request.designerId) {
      await this.notifications.notify({
        userId: request.designerId,
        type: NotificationType.REQUEST,
        title: 'New project request',
        message: `${user.name} sent you a request: "${request.title}"`,
        metadata: { requestId: request.id },
      });
    }

    return { success: true, data: { request: this.serialize(request) } };
  }

  async listMine(user: AuthUser, query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = paginate(query);
    const hidden =
      user.activeRole === Role.CLIENT
        ? []
        : [...(await this.blocks.listBlockedCounterpartIds(user.id))];
    const where =
      user.activeRole === Role.CLIENT
        ? { clientId: user.id }
        : {
            OR: [
              { type: RequestType.DIRECT, designerId: user.id },
              {
                type: RequestType.OPEN,
                status: RequestStatus.OPEN,
                clientId: { notIn: [user.id, ...hidden] },
              },
            ],
          };

    const [total, items] = await Promise.all([
      this.prisma.projectRequest.count({ where }),
      this.prisma.projectRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: requestInclude,
        skip,
        take,
      }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((r) => this.serialize(r)),
        page,
        pageSize,
        total,
      },
    };
  }

  async listOpen(query: ListOpenRequestsQueryDto) {
    const { page, pageSize, skip, take } = paginate(query);
    const q = query.q?.trim();
    const location = query.location?.trim();
    const where: Prisma.ProjectRequestWhereInput = {
      type: RequestType.OPEN,
      status: RequestStatus.OPEN,
      client: {
        status: AccountStatus.ACTIVE,
        ...(location
          ? { location: { contains: location, mode: 'insensitive' } }
          : {}),
      },
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.minBudget !== undefined || query.maxBudget !== undefined
        ? {
            budget: {
              ...(query.minBudget !== undefined
                ? { gte: query.minBudget }
                : {}),
              ...(query.maxBudget !== undefined
                ? { lte: query.maxBudget }
                : {}),
            },
          }
        : {}),
    };
    const sortBy: Prisma.ProjectRequestOrderByWithRelationInput =
      query.sort === 'budget_high'
        ? { budget: 'desc' }
        : query.sort === 'budget_low'
          ? { budget: 'asc' }
          : { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.projectRequest.count({ where }),
      this.prisma.projectRequest.findMany({
        where,
        orderBy: [sortBy, { id: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          timeline: true,
          budget: true,
          createdAt: true,
          briefSnapshot: true,
          brief: { select: { styles: true, rooms: true } },
          client: { select: { location: true } },
          _count: { select: { proposals: true } },
        },
        skip,
        take,
      }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((request) => ({
          id: request.id,
          title: request.title,
          description: request.description,
          timeline: request.timeline,
          budget: request.budget !== null ? Number(request.budget) : null,
          createdAt: request.createdAt,
          styles:
            (request.briefSnapshot as BriefView | null)?.styles ??
            request.brief?.styles ??
            [],
          rooms:
            (request.briefSnapshot as BriefView | null)?.rooms ??
            request.brief?.rooms ??
            [],
          location: request.client.location,
          proposalCount: request._count.proposals,
        })),
        page,
        pageSize,
        total,
      },
    };
  }

  async getById(user: AuthUser, id: string) {
    const request = await this.requirePartyAccess(id, user);
    return {
      success: true,
      data: {
        request: {
          ...this.serialize(request),
          moodboardReview: await this.moodboardReview(request),
        },
      },
    };
  }

  /** Where the designer's review of the request's moodboard stands. */
  private async moodboardReview(request: {
    id: string;
    briefSnapshot?: unknown;
  }) {
    const moodboardId = (request.briefSnapshot as BriefView | null)?.moodboard
      ?.id;
    if (!moodboardId) return null;
    const moodboard = await this.prisma.moodboard.findUnique({
      where: { id: moodboardId },
      select: { status: true, reviewNote: true, reviewRequestId: true },
    });
    if (!moodboard) return null;
    const here = moodboard.reviewRequestId === request.id;
    return {
      status: here ? moodboard.status : MoodboardStatus.OPEN,
      note: here ? moodboard.reviewNote : null,
    };
  }

  async reviewMoodboard(user: AuthUser, id: string, dto: ReviewMoodboardDto) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        clientId: true,
        designerId: true,
        briefSnapshot: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.designerId !== user.id) {
      throw new ForbiddenException('This request is not assigned to you');
    }
    const moodboardId = (request.briefSnapshot as BriefView | null)?.moodboard
      ?.id;
    const moodboard = moodboardId
      ? await this.prisma.moodboard.findUnique({ where: { id: moodboardId } })
      : null;
    if (!moodboard) {
      throw new NotFoundException('This request has no moodboard to review');
    }
    const note = dto.note?.trim();
    if (!dto.approve && !note) {
      throw new BadRequestException('Say what you would like changed');
    }

    await this.prisma.moodboard.update({
      where: { id: moodboard.id },
      data: {
        status: dto.approve
          ? MoodboardStatus.APPROVED
          : MoodboardStatus.CHANGES_REQUESTED,
        reviewNote: dto.approve ? null : note,
        reviewRequestId: request.id,
      },
    });

    await this.notifications.notify({
      userId: request.clientId,
      type: NotificationType.REQUEST,
      title: dto.approve
        ? 'Moodboard approved'
        : 'Changes requested on your moodboard',
      message: dto.approve
        ? `${user.name} approved your moodboard "${moodboard.name}" for "${request.title}"`
        : `${user.name} asked for changes to "${moodboard.name}": ${note}`,
      metadata: { requestId: request.id },
    });

    return {
      success: true,
      data: { moodboardReview: await this.moodboardReview(request) },
    };
  }

  async cancel(user: AuthUser, id: string) {
    const request = await this.requireOwned(id, user.id);
    if (request.status === RequestStatus.ACCEPTED) {
      throw new BadRequestException('Cannot cancel an accepted request');
    }
    if (
      request.status === RequestStatus.CANCELLED ||
      request.status === RequestStatus.CLOSED
    ) {
      throw new BadRequestException('Request is already closed or cancelled');
    }

    const updated = await this.prisma.projectRequest.update({
      where: { id, status: request.status },
      data: { status: RequestStatus.CANCELLED },
      include: requestInclude,
    });

    await this.notifications.notifyMany(
      [
        ...(request.designerId ? [request.designerId] : []),
        ...(await this.pendingProposalDesignerIds(id)),
      ],
      {
        type: NotificationType.REQUEST,
        title: 'Request cancelled',
        message: `The client cancelled "${request.title}"`,
        metadata: { requestId: id },
      },
    );
    await this.rejectPendingProposals(id);

    return { success: true, data: { request: this.serialize(updated) } };
  }

  async close(user: AuthUser, id: string) {
    const request = await this.requireOwned(id, user.id);
    if (request.type !== RequestType.OPEN) {
      throw new BadRequestException('Only OPEN requests can be closed');
    }
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Request is not open for proposals');
    }

    const updated = await this.prisma.projectRequest.update({
      where: { id, status: RequestStatus.OPEN },
      data: { status: RequestStatus.CLOSED },
      include: requestInclude,
    });

    await this.notifications.notifyMany(
      await this.pendingProposalDesignerIds(id),
      {
        type: NotificationType.REQUEST,
        title: 'Request closed',
        message: `"${request.title}" is no longer taking proposals`,
        metadata: { requestId: id },
      },
    );
    await this.rejectPendingProposals(id);

    return { success: true, data: { request: this.serialize(updated) } };
  }

  private rejectPendingProposals(requestId: string) {
    return this.prisma.proposal.updateMany({
      where: { requestId, status: ProposalStatus.PENDING },
      data: { status: ProposalStatus.REJECTED },
    });
  }

  private async pendingProposalDesignerIds(requestId: string) {
    const proposals = await this.prisma.proposal.findMany({
      where: { requestId, status: ProposalStatus.PENDING },
      select: { designerId: true },
    });
    return proposals.map((proposal) => proposal.designerId);
  }

  async decline(user: AuthUser, id: string) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.type !== RequestType.DIRECT || request.designerId !== user.id) {
      throw new ForbiddenException(
        'This direct request is not assigned to you',
      );
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is not awaiting a response');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.projectRequest.update({
        where: { id },
        data: { status: RequestStatus.REJECTED },
        include: requestInclude,
      }),
      this.prisma.proposal.updateMany({
        where: {
          requestId: id,
          designerId: user.id,
          status: ProposalStatus.PENDING,
        },
        data: { status: ProposalStatus.WITHDRAWN },
      }),
    ]);

    await this.notifications.notify({
      userId: request.clientId,
      type: NotificationType.REQUEST,
      title: 'Request declined',
      message: `${user.name} declined your request "${request.title}"`,
      metadata: { requestId: id },
    });

    return { success: true, data: { request: this.serialize(updated) } };
  }

  private async requireOwned(id: string, clientId: string) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.clientId !== clientId) {
      throw new ForbiddenException('You do not own this request');
    }
    return request;
  }

  private async requirePartyAccess(id: string, user: AuthUser) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const isClient = request.clientId === user.id;
    const isAssignedDesigner =
      user.activeRole === Role.DESIGNER && request.designerId === user.id;
    const isOpenForDesigners =
      user.activeRole === Role.DESIGNER &&
      request.type === RequestType.OPEN &&
      request.status === RequestStatus.OPEN;

    if (!isClient && !isAssignedDesigner && !isOpenForDesigners) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return request;
  }

  private serialize(request: {
    id: string;
    clientId: string;
    designerId: string | null;
    briefId: string | null;
    briefSnapshot?: unknown;
    portfolioId: string | null;
    title: string;
    description: string | null;
    timeline: string | null;
    type: RequestType;
    status: RequestStatus;
    budget: unknown;
    createdAt: Date;
    updatedAt: Date;
    brief?: BriefRow | null;
    portfolio?: {
      id: string;
      title: string;
      images: { imageUrl: string }[];
    } | null;
    designer?: {
      id: string;
      name: string;
      avatarUrl: string | null;
      isVerified: boolean;
      isAvailable: boolean;
    } | null;
    client?: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    _count?: { proposals: number };
  }) {
    return {
      id: request.id,
      clientId: request.clientId,
      designerId: request.designerId,
      briefId: request.briefId,
      portfolioId: request.portfolioId,
      title: request.title,
      description: request.description,
      timeline: request.timeline,
      type: request.type,
      status: request.status,
      budget: request.budget !== null ? Number(request.budget) : null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      brief: request.briefSnapshot
        ? (request.briefSnapshot as BriefView)
        : request.brief
          ? briefView(request.brief)
          : null,
      portfolio: request.portfolio
        ? {
            id: request.portfolio.id,
            title: request.portfolio.title,
            imageUrl: request.portfolio.images[0]?.imageUrl ?? null,
          }
        : null,
      designer: request.designer ?? null,
      client: request.client ?? null,
      proposalCount: request._count?.proposals ?? 0,
    };
  }
}
