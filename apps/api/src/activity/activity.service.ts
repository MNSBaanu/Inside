import { Injectable } from '@nestjs/common';
import { Prisma } from '@inside/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    projectId?: string | null;
    userId?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.prisma.activityLog.create({
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
}
