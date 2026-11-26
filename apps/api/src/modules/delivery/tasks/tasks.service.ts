import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus, StageStatus } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';

type StageWithProject = {
  status: StageStatus;
  project: { clientId: string; designerId: string; status: ProjectStatus };
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async listByStage(user: AuthUser, stageId: string) {
    const stage = await this.requireStage(stageId);
    if (
      stage.project.clientId !== user.id &&
      stage.project.designerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this stage');
    }
    const items = await this.prisma.task.findMany({
      where: { stageId },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: { items } };
  }

  async create(user: AuthUser, stageId: string, title: string) {
    const stage = await this.requireStage(stageId);
    this.assertEditable(user, stage);
    const task = await this.prisma.task.create({
      data: { stageId, title: title.trim() },
    });
    return { success: true, data: { task } };
  }

  async setDone(user: AuthUser, id: string, isDone: boolean) {
    const task = await this.requireTask(id);
    this.assertEditable(user, task.stage);
    const updated = await this.prisma.task.update({
      where: { id },
      data: { isDone },
    });
    return { success: true, data: { task: updated } };
  }

  async remove(user: AuthUser, id: string) {
    const task = await this.requireTask(id);
    this.assertEditable(user, task.stage);
    await this.prisma.task.delete({ where: { id } });
    return { success: true, data: { id } };
  }

  private assertEditable(user: AuthUser, stage: StageWithProject) {
    if (stage.project.designerId !== user.id) {
      throw new ForbiddenException('Only the assigned designer can do that');
    }
    if (stage.project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active');
    }
    if (stage.status === StageStatus.APPROVED) {
      throw new BadRequestException('Approved stages cannot be changed');
    }
    if (stage.status === StageStatus.SUBMITTED) {
      throw new BadRequestException(
        'Tasks are locked while the client reviews this stage',
      );
    }
  }

  private async requireStage(stageId: string) {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: stageId },
      select: {
        status: true,
        project: {
          select: { clientId: true, designerId: true, status: true },
        },
      },
    });
    if (!stage) {
      throw new NotFoundException('Stage not found');
    }
    return stage;
  }

  private async requireTask(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: {
        stage: {
          select: {
            status: true,
            project: {
              select: { clientId: true, designerId: true, status: true },
            },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}
