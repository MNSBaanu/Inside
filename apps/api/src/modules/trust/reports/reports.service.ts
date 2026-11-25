import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { serializeReport } from './report.serializer';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthUser, dto: CreateReportDto) {
    const reportedUserId = await this.resolveTarget(
      user,
      dto.targetType,
      dto.targetId,
    );
    if (reportedUserId === user.id) {
      throw new BadRequestException('You cannot report yourself');
    }

    const existing = await this.prisma.report.count({
      where: {
        reporterId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: { in: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW] },
      },
    });
    if (existing > 0) {
      throw new ConflictException(
        'You already reported this. An admin is looking at it.',
      );
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId,
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

    return { success: true, data: { report: serializeReport(report) } };
  }

  async listMine(user: AuthUser) {
    const items = await this.prisma.report.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: { items: items.map(serializeReport) },
    };
  }

  private async resolveTarget(
    user: AuthUser,
    type: ReportTargetType,
    id: string,
  ): Promise<string | null> {
    const missing = () => new NotFoundException('Reported item not found');
    const party = (project: { clientId: string; designerId: string }) => {
      if (![project.clientId, project.designerId].includes(user.id)) {
        throw new ForbiddenException(
          'Only the people in this project can report it',
        );
      }
      return project.clientId === user.id
        ? project.designerId
        : project.clientId;
    };

    switch (type) {
      case ReportTargetType.USER: {
        const found = await this.prisma.user.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!found) throw missing();
        return found.id;
      }
      case ReportTargetType.PORTFOLIO: {
        const found = await this.prisma.portfolio.findUnique({
          where: { id },
          select: { designerId: true },
        });
        if (!found) throw missing();
        return found.designerId;
      }
      case ReportTargetType.REVIEW: {
        const found = await this.prisma.review.findUnique({
          where: { id },
          select: { reviewerId: true },
        });
        if (!found) throw missing();
        return found.reviewerId;
      }
      case ReportTargetType.PROJECT: {
        const found = await this.prisma.project.findUnique({
          where: { id },
          select: { clientId: true, designerId: true },
        });
        if (!found) throw missing();
        return party(found);
      }
      case ReportTargetType.MESSAGE: {
        const found = await this.prisma.message.findUnique({
          where: { id },
          select: {
            senderId: true,
            project: { select: { clientId: true, designerId: true } },
          },
        });
        if (!found) throw missing();
        party(found.project);
        return found.senderId;
      }
    }
  }
}
