import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Best-effort: a logging failure never fails the action being logged. */
  async log(input: {
    projectId?: string | null;
    userId?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
  }) {
    try {
      await this.prisma.activityLog.create({
        data: {
          projectId: input.projectId ?? null,
          userId: input.userId ?? null,
          action: input.action,
          metadata:
            input.metadata === undefined || input.metadata === null
              ? Prisma.JsonNull
              : (input.metadata as Prisma.InputJsonValue),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to log ${input.action}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async listByProject(projectId: string) {
    const items = await this.prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      userId: item.userId,
      action: item.action,
      metadata: item.metadata,
      createdAt: item.createdAt,
      user: item.user ?? null,
    }));
  }

  async listRecent(
    page: number,
    pageSize: number,
    filter: { action?: string; search?: string } = {},
  ) {
    const where: Prisma.ActivityLogWhereInput = {
      ...(filter.action ? { action: filter.action } : {}),
      ...(filter.search
        ? {
            OR: [
              { action: { contains: filter.search, mode: 'insensitive' } },
              {
                user: {
                  name: { contains: filter.search, mode: 'insensitive' },
                },
              },
              {
                project: {
                  title: { contains: filter.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [total, items, actions] = await this.prisma.$transaction([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, title: true } },
        },
      }),
      this.prisma.activityLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
    ]);
    return {
      total,
      actions: actions.map((row) => row.action),
      items: items.map((item) => ({
        id: item.id,
        projectId: item.projectId,
        userId: item.userId,
        action: item.action,
        metadata: item.metadata,
        createdAt: item.createdAt,
        user: item.user ?? null,
        project: item.project ?? null,
      })),
    };
  }
}
