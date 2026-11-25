import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ProjectStatus, StageStatus } from '@inside/database';
import { stageLabel } from '../../../common/format';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { requirementFor } from '../stages/stage-requirements';
import {
  CreateDeliverableDto,
  UpdateDeliverableFeedbackDto,
} from './dto/create-deliverable.dto';

@Injectable()
export class DeliverablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async listByStage(user: AuthUser, stageId: string) {
    const stage = await this.requireStage(stageId);
    this.assertParty(user, stage);
    const items = await this.prisma.deliverable.findMany({
      where: { stageId },
      orderBy: { version: 'asc' },
    });
    return {
      success: true,
      data: { items: items.map((d) => this.serialize(d)) },
    };
  }

  async create(user: AuthUser, stageId: string, dto: CreateDeliverableDto) {
    const stage = await this.requireStage(stageId);
    if (stage.project.designerId !== user.id) {
      throw new ForbiddenException(
        'Only the assigned designer can upload deliverables',
      );
    }
    if (stage.project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active');
    }
    if (
      stage.status !== StageStatus.IN_PROGRESS &&
      stage.status !== StageStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Deliverables can only be uploaded on active stages',
      );
    }

    if (
      dto.requirement &&
      requirementFor(stage.name, dto.requirement)?.kind !== 'FILES'
    ) {
      throw new BadRequestException('Unknown item for this stage');
    }

    if (dto.fileHash) {
      const same = await this.prisma.deliverable.findFirst({
        where: { stageId, fileHash: dto.fileHash },
        select: { version: true },
      });
      if (same) {
        throw new ConflictException(
          `This file is already on this stage as v${same.version}`,
        );
      }
    }

    const last = await this.prisma.deliverable.findFirst({
      where: { stageId },
      orderBy: { version: 'desc' },
    });
    const version = (last?.version ?? 0) + 1;

    const created = await this.prisma.deliverable.create({
      data: {
        stageId,
        version,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileHash: dto.fileHash,
        notes: dto.notes,
        requirement: dto.requirement,
      },
    });

    await this.notifications.notify({
      userId: stage.project.clientId,
      type: NotificationType.DELIVERABLE,
      title: 'New deliverable',
      message: `New ${stageLabel(stage.name)} deliverable (v${version}) on "${stage.project.title}"`,
      metadata: {
        projectId: stage.projectId,
        stageId: stage.id,
        deliverableId: created.id,
      },
    });

    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'DELIVERABLE_UPLOADED',
      metadata: { stageId: stage.id, deliverableId: created.id, version },
    });

    return { success: true, data: { deliverable: this.serialize(created) } };
  }

  async setFeedback(
    user: AuthUser,
    id: string,
    dto: UpdateDeliverableFeedbackDto,
  ) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id },
      include: {
        stage: {
          include: {
            project: {
              select: {
                id: true,
                clientId: true,
                designerId: true,
                title: true,
              },
            },
          },
        },
      },
    });
    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }
    if (deliverable.stage.project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can leave feedback');
    }

    const updated = await this.prisma.deliverable.update({
      where: { id },
      data: { feedback: dto.feedback },
    });

    await this.notifications.notify({
      userId: deliverable.stage.project.designerId,
      type: NotificationType.DELIVERABLE,
      title: 'Deliverable feedback',
      message: `Client left feedback on v${deliverable.version}`,
      metadata: {
        projectId: deliverable.stage.projectId,
        stageId: deliverable.stageId,
        deliverableId: id,
      },
    });

    await this.activity.log({
      projectId: deliverable.stage.projectId,
      userId: user.id,
      action: 'DELIVERABLE_FEEDBACK',
      metadata: {
        stageId: deliverable.stageId,
        deliverableId: id,
        version: deliverable.version,
      },
    });

    return { success: true, data: { deliverable: this.serialize(updated) } };
  }

  private async requireStage(stageId: string) {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: stageId },
      include: {
        project: {
          select: {
            id: true,
            clientId: true,
            designerId: true,
            title: true,
            status: true,
          },
        },
      },
    });
    if (!stage) {
      throw new NotFoundException('Stage not found');
    }
    return stage;
  }

  private assertParty(
    user: AuthUser,
    stage: { project: { clientId: string; designerId: string } },
  ) {
    if (
      stage.project.clientId !== user.id &&
      stage.project.designerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this stage');
    }
  }

  private serialize(d: {
    id: string;
    stageId: string;
    version: number;
    requirement: string | null;
    fileUrl: string;
    fileName: string | null;
    fileHash: string | null;
    notes: string | null;
    feedback: string | null;
    uploadedAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: d.id,
      stageId: d.stageId,
      version: d.version,
      requirement: d.requirement,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      fileHash: d.fileHash,
      notes: d.notes,
      feedback: d.feedback,
      uploadedAt: d.uploadedAt,
      updatedAt: d.updatedAt,
    };
  }
}
