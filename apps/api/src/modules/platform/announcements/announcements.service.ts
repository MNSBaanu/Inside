import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  AccountStatus,
  AnnouncementAudience,
  NotificationType,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import {
  paginate,
  PaginationQueryDto,
} from '../../../common/dto/pagination-query.dto';
import { PrismaService } from '../../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

const AUDIENCE_ROLE: Record<AnnouncementAudience, Role | null> = {
  ALL: null,
  CLIENTS: Role.CLIENT,
  DESIGNERS: Role.DESIGNER,
};

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  async active(user: AuthUser) {
    const audiences: AnnouncementAudience[] = [AnnouncementAudience.ALL];
    if (user.role === Role.CLIENT || user.hasClientAccount) {
      audiences.push(AnnouncementAudience.CLIENTS);
    }
    if (user.role === Role.DESIGNER) {
      audiences.push(AnnouncementAudience.DESIGNERS);
    }
    const items = await this.prisma.announcement.findMany({
      where: {
        ...(user.role === Role.ADMIN ? {} : { audience: { in: audiences } }),
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    return { success: true, data: { items } };
  }

  async list(query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 20);
    const [total, items] = await Promise.all([
      this.prisma.announcement.count(),
      this.prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return { success: true, data: { items, page, pageSize, total } };
  }

  async create(admin: AuthUser, dto: CreateAnnouncementDto) {
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= new Date()) {
      throw new BadRequestException('The end time must be in the future');
    }
    const audience = dto.audience ?? AnnouncementAudience.ALL;
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        message: dto.message.trim(),
        audience,
        tone: dto.tone,
        endsAt,
        createdById: admin.id,
      },
    });

    const role = AUDIENCE_ROLE[audience];
    const recipients = await this.prisma.user.findMany({
      where: {
        status: AccountStatus.ACTIVE,
        id: { not: admin.id },
        ...(role === Role.CLIENT
          ? { OR: [{ role }, { hasClientAccount: true }] }
          : role
            ? { role }
            : {}),
      },
      select: { id: true },
    });
    await this.prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        type: NotificationType.SYSTEM,
        title: announcement.title,
        message: announcement.message,
        metadata: { announcementId: announcement.id },
      })),
    });

    for (const r of recipients) {
      this.realtime?.toUser(r.id, 'notification:new', {
        type: NotificationType.SYSTEM,
        title: announcement.title,
      });
      this.realtime?.toUser(r.id, 'announcement:new', { id: announcement.id });
    }

    await this.activity.log({
      userId: admin.id,
      action: 'ANNOUNCEMENT_SENT',
      metadata: {
        announcementId: announcement.id,
        audience,
        recipients: recipients.length,
      },
    });

    return {
      success: true,
      data: { announcement, recipients: recipients.length },
    };
  }

  async end(admin: AuthUser, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    if (announcement.endsAt && announcement.endsAt <= new Date()) {
      throw new BadRequestException('Announcement has already ended');
    }
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { endsAt: new Date() },
    });
    await this.activity.log({
      userId: admin.id,
      action: 'ANNOUNCEMENT_ENDED',
      metadata: { announcementId: id },
    });
    return { success: true, data: { announcement: updated } };
  }
}
