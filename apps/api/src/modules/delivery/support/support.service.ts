import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { NotificationType, Role, type SupportMessage } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import {
  PaginationQueryDto,
  paginate,
} from '../../../common/dto/pagination-query.dto';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { RealtimeService } from '../../platform/realtime/realtime.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';

export const supportThreadId = (userId: string) => `support:${userId}`;

type WithSender = SupportMessage & {
  sender: { id: string; name: string; avatarUrl: string | null };
};

/** One support conversation per client or designer, shared by every admin. */
@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  async conversations(search?: string) {
    const term = search?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        role: { not: Role.ADMIN },
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        supportThread: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { content: true, sentAt: true, fromAdmin: true },
        },
        _count: {
          select: {
            supportThread: { where: { fromAdmin: false, isRead: false } },
          },
        },
      },
    });

    const items = users
      .map(({ supportThread, _count, ...user }) => ({
        ...user,
        lastMessage: supportThread[0] ?? null,
        unreadCount: _count.supportThread,
      }))
      .sort((a, b) => {
        const left = a.lastMessage?.sentAt.getTime() ?? 0;
        const right = b.lastMessage?.sentAt.getTime() ?? 0;
        return right - left;
      });
    return { success: true, data: { items } };
  }

  async summary(user: AuthUser) {
    const unreadCount = await this.prisma.supportMessage.count({
      where:
        user.role === Role.ADMIN
          ? { fromAdmin: false, isRead: false }
          : { userId: user.id, fromAdmin: true, isRead: false },
    });
    const last =
      user.role === Role.ADMIN
        ? null
        : await this.prisma.supportMessage.findFirst({
            where: { userId: user.id },
            orderBy: { sentAt: 'desc' },
            select: { content: true, sentAt: true, fromAdmin: true },
          });
    return { success: true, data: { unreadCount, lastMessage: last } };
  }

  async list(viewer: AuthUser, userId: string, query: PaginationQueryDto) {
    await this.requireThreadOwner(userId);
    const { page, pageSize, skip, take } = paginate(query, 100);
    const where = { userId };
    const [total, items] = await Promise.all([
      this.prisma.supportMessage.count({ where }),
      this.prisma.supportMessage.findMany({
        where,
        orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.reverse().map((m) => this.serialize(m, viewer)),
        page,
        pageSize,
        total,
      },
    };
  }

  async send(viewer: AuthUser, userId: string, dto: SendMessageDto) {
    await this.requireThreadOwner(userId);
    const fromAdmin = viewer.role === Role.ADMIN;
    const created = await this.prisma.supportMessage.create({
      data: {
        userId,
        senderId: viewer.id,
        fromAdmin,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
        attachmentType: dto.attachmentType,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (fromAdmin) {
      await this.notifications.notify({
        userId,
        type: NotificationType.MESSAGE,
        title: 'New message from Inside support',
        message: dto.content.slice(0, 120),
        metadata: { support: true, messageId: created.id },
      });
    }

    const message = this.serialize(created, viewer);
    this.broadcast(userId, 'message:new', message);
    this.broadcast(userId, 'conversation:updated', {
      projectId: supportThreadId(userId),
    });
    return { success: true, data: { message } };
  }

  async markAllRead(viewer: AuthUser, userId: string) {
    await this.requireThreadOwner(userId);
    const result = await this.prisma.supportMessage.updateMany({
      where: {
        userId,
        fromAdmin: viewer.role !== Role.ADMIN,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    if (result.count > 0) {
      const projectId = supportThreadId(userId);
      this.broadcast(userId, 'message:read', {
        projectId,
        readerId: viewer.id,
      });
      this.broadcast(userId, 'conversation:updated', { projectId });
    }
    return { success: true, data: { updated: result.count } };
  }

  private broadcast(userId: string, event: string, payload: unknown) {
    this.realtime?.toUser(userId, event, payload);
    this.realtime?.toAdmins(event, payload);
  }

  private async requireThreadOwner(userId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!owner) throw new NotFoundException('User not found');
    if (owner.role === Role.ADMIN) {
      throw new BadRequestException('Admins do not have a support chat');
    }
  }

  /** Shaped like a project message so the same chat view can show it. */
  private serialize(m: WithSender, viewer: AuthUser) {
    const adminView = viewer.role === Role.ADMIN;
    return {
      id: m.id,
      projectId: supportThreadId(m.userId),
      senderId: m.senderId,
      receiverId: m.fromAdmin ? m.userId : adminView ? viewer.id : 'support',
      content: m.content,
      isHidden: false,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      isRead: m.isRead,
      readAt: m.readAt,
      sentAt: m.sentAt,
      sender:
        m.fromAdmin && !adminView
          ? { id: 'support', name: 'Inside support', avatarUrl: null }
          : m.sender,
    };
  }
}
