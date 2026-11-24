import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PaymentStatus,
  PortfolioShareStatus,
  ProjectStatus,
  Role,
  StageName,
  StageStatus,
} from '@inside/database';
import { stageLabel } from '../../../common/format';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';

const projectInclude = {
  stages: { orderBy: { stageOrder: 'asc' } },
  client: { select: { id: true, name: true, avatarUrl: true } },
  designer: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      isVerified: true,
      isAvailable: true,
    },
  },
  portfolio: { select: { id: true } },
} as const;

const IMAGE_FILE = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

type ProjectWithIncludes = {
  id: string;
  proposalId: string;
  clientId: string;
  designerId: string;
  title: string;
  currentStage: StageName;
  status: ProjectStatus;
  portfolioShare?: PortfolioShareStatus | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  portfolio?: { id: string } | null;
  stages: {
    id: string;
    stageOrder: number;
    name: StageName;
    status: StageStatus;
    fee: unknown;
    dueDate: Date | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
  }[];
  client?: { id: string; name: string; avatarUrl: string | null };
  designer?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    isVerified: boolean;
    isAvailable: boolean;
  };
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    private readonly payments: PaymentsService,
  ) {}

  async listMine(user: AuthUser) {
    const where =
      user.activeRole === Role.DESIGNER
        ? { designerId: user.id }
        : { clientId: user.id };

    const items = await this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: projectInclude,
    });

    const projectIds = items.map((p) => p.id);
    const [unreadRows, latestRows] = await Promise.all([
      this.prisma.message.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          receiverId: user.id,
          isRead: false,
        },
        _count: { _all: true },
      }),
      this.prisma.message.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { sentAt: 'desc' },
        distinct: ['projectId'],
        select: {
          projectId: true,
          senderId: true,
          content: true,
          sentAt: true,
        },
      }),
    ]);

    const unreadByProject = new Map(
      unreadRows.map((row) => [row.projectId, row._count._all]),
    );
    const lastByProject = new Map(
      latestRows.map((row) => [row.projectId, row]),
    );

    return {
      success: true,
      data: {
        items: items.map((p) => ({
          ...this.serialize(p),
          unreadCount: unreadByProject.get(p.id) ?? 0,
          lastMessage: lastByProject.get(p.id) ?? null,
        })),
      },
    };
  }

  async getById(user: AuthUser, id: string) {
    const project = await this.requirePartyAccess(id, user);
    const reviewed =
      (await this.prisma.review.count({
        where: { projectId: id, reviewerId: user.id },
      })) > 0;
    return {
      success: true,
      data: { project: { ...this.serialize(project), reviewed } },
    };
  }

  /** Designer asks the client for permission to show a completed project in their portfolio. */
  async requestPortfolioShare(user: AuthUser, id: string) {
    const project = await this.requirePartyAccess(id, user);
    if (project.designerId !== user.id) {
      throw new ForbiddenException(
        'Only the designer can ask to feature this project',
      );
    }
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed projects can be added to a portfolio',
      );
    }
    if (project.portfolioShare) {
      throw new BadRequestException(
        'Permission was already requested for this project',
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { portfolioShare: PortfolioShareStatus.PENDING },
      include: projectInclude,
    });
    await this.notifications.notify({
      userId: project.clientId,
      type: NotificationType.PROJECT,
      title: 'Portfolio request',
      message: `${project.designer?.name ?? 'Your designer'} would like to show "${project.title}" in their portfolio. Your name will not be shown.`,
      metadata: { projectId: id },
    });
    return { success: true, data: { project: this.serialize(updated) } };
  }

  /** The client's answer is final. */
  async answerPortfolioShare(user: AuthUser, id: string, approve: boolean) {
    const project = await this.requirePartyAccess(id, user);
    if (project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can answer this request');
    }
    if (project.portfolioShare !== PortfolioShareStatus.PENDING) {
      throw new BadRequestException('There is no pending portfolio request');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        portfolioShare: approve
          ? PortfolioShareStatus.APPROVED
          : PortfolioShareStatus.DECLINED,
      },
      include: projectInclude,
    });
    await this.notifications.notify({
      userId: project.designerId,
      type: NotificationType.PROJECT,
      title: approve
        ? 'Portfolio request approved'
        : 'Portfolio request declined',
      message: approve
        ? `You can now add "${project.title}" to your portfolio.`
        : `The client prefers not to show "${project.title}" in your portfolio.`,
      metadata: { projectId: id },
    });
    return { success: true, data: { project: this.serialize(updated) } };
  }

  /** Pre-filled portfolio details for an approved project, built from its brief, request and image deliverables. */
  async portfolioDraft(user: AuthUser, id: string) {
    const project = await this.requirePartyAccess(id, user);
    if (
      project.designerId !== user.id ||
      project.portfolioShare !== PortfolioShareStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'This project is not approved for your portfolio',
      );
    }

    const source = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      select: {
        proposal: {
          select: {
            totalAmount: true,
            request: {
              select: {
                description: true,
                budget: true,
                brief: {
                  select: { styles: true, rooms: true, description: true },
                },
                portfolio: { select: { style: true, roomType: true } },
              },
            },
          },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          select: {
            deliverables: {
              orderBy: { version: 'asc' },
              select: { fileUrl: true, fileName: true },
            },
          },
        },
      },
    });

    const { request, totalAmount } = source.proposal;
    const budget = totalAmount ?? request.budget;
    return {
      success: true,
      data: {
        draft: {
          title: project.title,
          description: request.description ?? request.brief?.description ?? '',
          style: request.brief?.styles[0] ?? request.portfolio?.style ?? '',
          roomType:
            request.brief?.rooms[0] ?? request.portfolio?.roomType ?? '',
          budget: budget !== null ? Number(budget) : null,
          images: source.stages
            .flatMap((stage) => stage.deliverables)
            .filter((file) => IMAGE_FILE.test(file.fileName ?? file.fileUrl))
            .map((file) => ({ imageUrl: file.fileUrl, name: file.fileName })),
        },
      },
    };
  }

  async cancel(user: AuthUser, id: string, reason: string) {
    const project = await this.requirePartyAccess(id, user);
    if (
      project.status === ProjectStatus.COMPLETED ||
      project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException('Project is already closed');
    }

    if (user.id === project.clientId) {
      const underway = await this.prisma.milestonePayment.findFirst({
        where: {
          projectId: id,
          status: PaymentStatus.PAID,
          stage: {
            status: {
              in: [
                StageStatus.IN_PROGRESS,
                StageStatus.SUBMITTED,
                StageStatus.REJECTED,
              ],
            },
          },
        },
        select: { stage: { select: { name: true, status: true } } },
      });
      if (underway) {
        throw new BadRequestException(
          underway.stage.status === StageStatus.SUBMITTED
            ? `The ${stageLabel(underway.stage.name)} stage is paid and waiting for your review. Approve it or ask for changes first, or contact support to cancel.`
            : `The ${stageLabel(underway.stage.name)} stage is paid and the designer is working on it. Contact support to cancel so the payment can be settled fairly.`,
        );
      }
    }

    const { refunded, failed, offline } =
      await this.payments.cancelAndRefund(id);
    const updated = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: projectInclude,
    });

    const otherId =
      user.id === project.clientId ? project.designerId : project.clientId;
    await this.notifications.notify({
      userId: otherId,
      type: NotificationType.PROJECT,
      title: 'Project cancelled',
      message: `Project "${project.title}" was cancelled: ${reason}`,
      metadata: { projectId: id },
    });

    await this.activity.log({
      projectId: id,
      userId: user.id,
      action: 'PROJECT_CANCELLED',
      metadata: { reason, refunded, refundFailed: failed, offline },
    });

    return {
      success: true,
      data: {
        project: this.serialize(updated),
        refunded,
        refundFailed: failed,
        refundOffline: offline,
      },
    };
  }

  async putOnHold(user: AuthUser, id: string) {
    const project = await this.requirePartyAccess(id, user);
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Only active projects can be put on hold');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ON_HOLD },
      include: projectInclude,
    });

    const otherId =
      user.id === project.clientId ? project.designerId : project.clientId;
    await this.notifications.notify({
      userId: otherId,
      type: NotificationType.PROJECT,
      title: 'Project on hold',
      message: `Project "${project.title}" was placed on hold`,
      metadata: { projectId: id },
    });

    await this.activity.log({
      projectId: id,
      userId: user.id,
      action: 'PROJECT_ON_HOLD',
    });

    return { success: true, data: { project: this.serialize(updated) } };
  }

  async resume(user: AuthUser, id: string) {
    const project = await this.requirePartyAccess(id, user);
    if (project.status !== ProjectStatus.ON_HOLD) {
      throw new BadRequestException('Only on-hold projects can be resumed');
    }
    const pausedBy = await this.prisma.activityLog.findFirst({
      where: { projectId: id, action: 'PROJECT_ON_HOLD' },
      orderBy: { createdAt: 'desc' },
      select: { userId: true },
    });
    if (pausedBy?.userId && pausedBy.userId !== user.id) {
      throw new ForbiddenException(
        'Only the person who put the project on hold can resume it',
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ACTIVE },
      include: projectInclude,
    });

    const otherId =
      user.id === project.clientId ? project.designerId : project.clientId;
    await this.notifications.notify({
      userId: otherId,
      type: NotificationType.PROJECT,
      title: 'Project resumed',
      message: `Project "${project.title}" is active again`,
      metadata: { projectId: id },
    });

    await this.activity.log({
      projectId: id,
      userId: user.id,
      action: 'PROJECT_RESUMED',
    });

    return { success: true, data: { project: this.serialize(updated) } };
  }

  async listActivity(user: AuthUser, id: string) {
    await this.requirePartyAccess(id, user);
    const items = await this.activity.listByProject(id);
    return { success: true, data: { items } };
  }

  async requirePartyAccess(
    id: string,
    user: AuthUser,
  ): Promise<ProjectWithIncludes> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.clientId !== user.id && project.designerId !== user.id) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  serialize(project: ProjectWithIncludes) {
    return {
      id: project.id,
      proposalId: project.proposalId,
      clientId: project.clientId,
      designerId: project.designerId,
      title: project.title,
      currentStage: project.currentStage,
      status: project.status,
      portfolioShare: project.portfolioShare ?? null,
      portfolioId: project.portfolio?.id ?? null,
      startedAt: project.startedAt,
      completedAt: project.completedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stages: project.stages.map((s) => ({
        id: s.id,
        stageOrder: s.stageOrder,
        name: s.name,
        status: s.status,
        fee: s.fee !== null && s.fee !== undefined ? Number(s.fee) : null,
        dueDate: s.dueDate,
        submittedAt: s.submittedAt,
        approvedAt: s.approvedAt,
      })),
      client: project.client ?? null,
      designer: project.designer ?? null,
    };
  }
}
