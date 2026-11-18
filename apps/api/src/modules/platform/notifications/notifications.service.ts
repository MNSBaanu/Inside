import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  AccountStatus,
  NotificationType,
  Prisma,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /**
   * Create a notification for a user. Safe to fire-and-forget from other services.
   * Never throws — swallows errors so a notification failure never breaks the caller.
   */
  async notify(input: NotifyInput) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue,
        },
      });
      this.realtime?.toUser(input.userId, 'notification:new', {
        type: input.type,
        title: input.title,
      });
    } catch (error) {
      // Best-effort: log instead of failing the caller.
      this.logger.warn(
        `Failed to notify ${input.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async notifyAdmins(input: Omit<NotifyInput, 'userId'>) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, status: AccountStatus.ACTIVE },
        select: { id: true },
      });
      await this.notifyMany(
        admins.map((admin) => admin.id),
        input,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to notify admins: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async notifyMany(userIds: string[], input: Omit<NotifyInput, 'userId'>) {
    for (const userId of new Set(userIds)) {
      await this.notify({ ...input, userId });
    }
  }

  async listMine(user: AuthUser) {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      success: true,
      data: { items: items.map((n) => this.serialize(n)) },
    };
  }

  async markRead(user: AuthUser, id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    if (notif.userId !== user.id) {
      throw new ForbiddenException('Not your notification');
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true, data: { notification: this.serialize(updated) } };
  }

  async markAllRead(user: AuthUser) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true, data: { updated: result.count } };
  }

  private serialize(n: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata: unknown;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata ?? null,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    };
  }
}
