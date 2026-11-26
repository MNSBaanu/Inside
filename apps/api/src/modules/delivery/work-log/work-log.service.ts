import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ProjectStatus } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';

const TYPE_LABEL: Record<string, string> = {
  SITE_VISIT: 'site visit',
  MEASUREMENT: 'measurement',
  MEETING: 'meeting',
  ORDER: 'order',
  DELIVERY: 'delivery',
  INSTALLATION: 'installation',
  PROGRESS: 'progress update',
  ISSUE: 'issue',
};

const authorSelect = { select: { id: true, name: true, avatarUrl: true } };

@Injectable()
export class WorkLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async list(user: AuthUser, projectId: string) {
    await this.requireParty(projectId, user);
    const items = await this.prisma.workLog.findMany({
      where: { projectId },
      include: {
        author: authorSelect,
        stage: { select: { name: true } },
      },
      orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return {
      success: true,
      data: { items: items.map((item) => this.serialize(item)) },
    };
  }

  async create(user: AuthUser, projectId: string, dto: CreateWorkLogDto) {
    const project = await this.requireParty(projectId, user);
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active');
    }
    if (dto.happenedAt.getTime() > Date.now() + 5 * 60_000) {
      throw new BadRequestException('Log work that has already happened');
    }
    const earliest = new Date(project.createdAt);
    earliest.setDate(earliest.getDate() - 30);
    if (dto.happenedAt < earliest) {
      throw new BadRequestException('That date is before this project started');
    }
    const stage = await this.prisma.projectStage.findFirst({
      where: { projectId, name: project.currentStage },
      select: { id: true },
    });

    const created = await this.prisma.workLog.create({
      data: {
        projectId,
        stageId: stage?.id,
        authorId: user.id,
        type: dto.type,
        title: dto.title.trim(),
        note: dto.note?.trim() || null,
        photos: dto.photos ?? [],
        happenedAt: dto.happenedAt,
      },
      include: { author: authorSelect, stage: { select: { name: true } } },
    });

    await this.notifications.notify({
      userId: this.otherParty(project, user.id),
      type: NotificationType.PROJECT,
      title: `New ${TYPE_LABEL[dto.type]} logged`,
      message: `${user.name} logged "${created.title}" on "${project.title}". Please confirm it.`,
      metadata: { projectId, workLogId: created.id, tab: 'work-log' },
    });
    await this.activity.log({
      projectId,
      userId: user.id,
      action: 'WORK_LOGGED',
      metadata: { workLogId: created.id, type: dto.type, title: created.title },
    });

    return { success: true, data: { entry: this.serialize(created) } };
  }

  async confirm(user: AuthUser, id: string) {
    const entry = await this.requireEntry(id);
    const project = await this.requireParty(entry.projectId, user);
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active');
    }
    if (entry.authorId === user.id) {
      throw new ForbiddenException('The other party confirms this entry');
    }
    if (entry.confirmedAt) {
      throw new BadRequestException('This entry is already confirmed');
    }
    const updated = await this.prisma.workLog.update({
      where: { id },
      data: { confirmedAt: new Date(), confirmedById: user.id },
      include: { author: authorSelect, stage: { select: { name: true } } },
    });

    await this.notifications.notify({
      userId: entry.authorId,
      type: NotificationType.PROJECT,
      title: 'Work confirmed',
      message: `${user.name} confirmed "${entry.title}" on "${project.title}"`,
      metadata: { projectId: entry.projectId, workLogId: id, tab: 'work-log' },
    });
    await this.activity.log({
      projectId: entry.projectId,
      userId: user.id,
      action: 'WORK_CONFIRMED',
      metadata: { workLogId: id, type: entry.type, title: entry.title },
    });

    return { success: true, data: { entry: this.serialize(updated) } };
  }

  async remove(user: AuthUser, id: string) {
    const entry = await this.requireEntry(id);
    if (entry.authorId !== user.id) {
      throw new ForbiddenException('Only the author can delete this entry');
    }
    if (entry.confirmedAt) {
      throw new BadRequestException('Confirmed entries cannot be deleted');
    }
    const project = await this.requireParty(entry.projectId, user);
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active');
    }
    await this.prisma.workLog.delete({ where: { id } });
    await this.activity.log({
      projectId: entry.projectId,
      userId: user.id,
      action: 'WORK_LOG_DELETED',
      metadata: { workLogId: id, title: entry.title },
    });
    return { success: true, data: { deleted: true } };
  }

  private async requireEntry(id: string) {
    const entry = await this.prisma.workLog.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }
    return entry;
  }

  private async requireParty(projectId: string, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        clientId: true,
        designerId: true,
        status: true,
        currentStage: true,
        createdAt: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.clientId !== user.id && project.designerId !== user.id) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  private otherParty(
    project: { clientId: string; designerId: string },
    userId: string,
  ) {
    return userId === project.clientId ? project.designerId : project.clientId;
  }

  private serialize(entry: {
    id: string;
    projectId: string;
    stageId: string | null;
    type: string;
    title: string;
    note: string | null;
    photos: string[];
    happenedAt: Date;
    confirmedAt: Date | null;
    confirmedById: string | null;
    createdAt: Date;
    author: { id: string; name: string; avatarUrl: string | null };
    stage: { name: string } | null;
  }) {
    return {
      id: entry.id,
      projectId: entry.projectId,
      stageId: entry.stageId,
      stageName: entry.stage?.name ?? null,
      type: entry.type,
      title: entry.title,
      note: entry.note,
      photos: entry.photos,
      happenedAt: entry.happenedAt,
      confirmedAt: entry.confirmedAt,
      confirmedById: entry.confirmedById,
      createdAt: entry.createdAt,
      author: entry.author,
    };
  }
}
