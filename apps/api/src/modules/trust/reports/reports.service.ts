import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  ReportStatus,
  ReportTargetType,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthUser, dto: CreateReportDto) {
    if (
      (dto.targetType === ReportTargetType.USER && dto.targetId === user.id) ||
      dto.reportedUserId === user.id
    ) {
      throw new BadRequestException('Cannot report yourself');
    }
    if (!(await this.targetExists(dto.targetType, dto.targetId))) {
      throw new NotFoundException('Reported item not found');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: dto.reportedUserId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    await this.notifications.notifyAdmins({
      type: NotificationType.SYSTEM,
      title: 'New report',
      message: `${user.name} reported a ${dto.targetType.toLowerCase()}: "${dto.reason}"`,
      metadata: { reportId: report.id, href: '/admin/reports' },
    });

    return { success: true, data: { report: this.serialize(report) } };
  }

  async listMine(user: AuthUser) {
    const items = await this.prisma.report.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: { items: items.map((r) => this.serialize(r)) },
    };
  }

  private async targetExists(type: ReportTargetType, id: string) {
    const counters: Record<ReportTargetType, () => Promise<number>> = {
      [ReportTargetType.USER]: () => this.prisma.user.count({ where: { id } }),
      [ReportTargetType.PROJECT]: () =>
        this.prisma.project.count({ where: { id } }),
      [ReportTargetType.PORTFOLIO]: () =>
        this.prisma.portfolio.count({ where: { id } }),
      [ReportTargetType.REVIEW]: () =>
        this.prisma.review.count({ where: { id } }),
      [ReportTargetType.MESSAGE]: () =>
        this.prisma.message.count({ where: { id } }),
    };
    return (await counters[type]()) > 0;
  }

  serialize(r: {
    id: string;
    reporterId: string;
    reportedUserId: string | null;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details: string | null;
    status: ReportStatus;
    resolvedById: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: r.id,
      reporterId: r.reporterId,
      reportedUserId: r.reportedUserId,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      details: r.details,
      status: r.status,
      resolvedById: r.resolvedById,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
