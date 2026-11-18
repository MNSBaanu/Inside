import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { NotificationType } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { BlocksService } from '../../trust/blocks/blocks.service';
import {
  PaginationQueryDto,
  paginate,
} from '../../../common/dto/pagination-query.dto';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { RealtimeService } from '../../platform/realtime/realtime.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BlocksService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /** Page 1 holds the newest messages; each page is returned oldest first. */
  async list(user: AuthUser, projectId: string, query: PaginationQueryDto) {
    await this.requireParty(projectId, user);
    const { page, pageSize, skip, take } = paginate(query, 100);
    const [total, items] = await Promise.all([
      this.prisma.message.count({ where: { projectId } }),
      this.prisma.message.findMany({
        where: { projectId },
        orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.reverse().map((m) => this.serialize(m)),
        page,
        pageSize,
        total,
      },
    };
  }

  async send(user: AuthUser, projectId: string, dto: SendMessageDto) {
    const project = await this.requireParty(projectId, user);
    const receiverId =
      user.id === project.clientId ? project.designerId : project.clientId;
    await this.blocks.assertNotBlocked(user.id, receiverId);

    const created = await this.prisma.message.create({
      data: {
        projectId,
        senderId: user.id,
        receiverId,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
        attachmentType: dto.attachmentType,
      },
    });

    await this.notifications.notify({
      userId: receiverId,
      type: NotificationType.MESSAGE,
      title: 'New message',
      message: `${user.name} sent a message on "${project.title}"`,
      metadata: { projectId, messageId: created.id },
    });

    const message = this.serialize(created);
    this.realtime?.toProject(projectId, 'message:new', message);
    return { success: true, data: { message } };
  }

  async markRead(user: AuthUser, id: string) {
    const msg = await this.prisma.message.findUnique({ where: { id } });
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
    if (msg.receiverId !== user.id) {
      throw new ForbiddenException('Only the receiver can mark read');
    }
    if (msg.isRead) {
      return { success: true, data: { message: this.serialize(msg) } };
    }
    const updated = await this.prisma.message.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    this.realtime?.toProject(updated.projectId, 'message:read', {
      projectId: updated.projectId,
      readerId: user.id,
    });
    return { success: true, data: { message: this.serialize(updated) } };
  }

  async markAllRead(user: AuthUser, projectId: string) {
    await this.requireParty(projectId, user);
    const result = await this.prisma.message.updateMany({
      where: { projectId, receiverId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    if (result.count > 0) {
      this.realtime?.toProject(projectId, 'message:read', {
        projectId,
        readerId: user.id,
      });
    }
    return { success: true, data: { updated: result.count } };
  }

  private async requireParty(projectId: string, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        clientId: true,
        designerId: true,
        title: true,
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

  private serialize(m: {
    id: string;
    projectId: string;
    senderId: string;
    receiverId: string;
    content: string;
    isHidden?: boolean;
    attachmentUrl: string | null;
    attachmentType: string | null;
    isRead: boolean;
    readAt: Date | null;
    sentAt: Date;
  }) {
    return {
      id: m.id,
      projectId: m.projectId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.isHidden ? 'This message was removed by an admin.' : m.content,
      isHidden: m.isHidden ?? false,
      attachmentUrl: m.isHidden ? null : m.attachmentUrl,
      attachmentType: m.isHidden ? null : m.attachmentType,
      isRead: m.isRead,
      readAt: m.readAt,
      sentAt: m.sentAt,
    };
  }
}
