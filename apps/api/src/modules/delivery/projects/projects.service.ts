import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  ProjectStatus,
  Role,
  StageName,
  StageStatus,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';

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
} as const;

type ProjectWithIncludes = {
  id: string;
  proposalId: string;
  clientId: string;
  designerId: string;
  title: string;
  currentStage: StageName;
  status: ProjectStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
    return { success: true, data: { project: this.serialize(project) } };
  }

  async cancel(user: AuthUser, id: string, reason: string) {
    const project = await this.requirePartyAccess(id, user);
    if (
      project.status === ProjectStatus.COMPLETED ||
      project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException('Project is already closed');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.CANCELLED },
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
      metadata: { reason },
    });

    return { success: true, data: { project: this.serialize(updated) } };
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
