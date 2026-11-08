import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  NotificationType,
  ReportStatus,
  ReportTargetType,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import {
  PaginationQueryDto,
  paginate,
} from '../../../common/dto/pagination-query.dto';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async listUsers(query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 100);
    const [total, items] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          activeRole: true,
          isVerified: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);
    return { success: true, data: { items, page, pageSize, total } };
  }

  async suspend(admin: AuthUser, userId: string) {
    if (userId === admin.id) {
      throw new BadRequestException('Cannot suspend yourself');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status === AccountStatus.SUSPENDED) {
      throw new BadRequestException('User is already suspended');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { status: AccountStatus.SUSPENDED },
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return u;
    });

    await this.notifications.notify({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Account suspended',
      message: 'Your account was suspended by an administrator',
    });

    await this.activity.log({
      userId: admin.id,
      action: 'USER_SUSPENDED',
      metadata: { targetUserId: userId },
    });

    return {
      success: true,
      data: { user: { id: updated.id, status: updated.status } },
    };
  }

  async reactivate(admin: AuthUser, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status === AccountStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: AccountStatus.ACTIVE },
    });

    await this.notifications.notify({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Account reactivated',
      message: 'Your account was reactivated',
    });

    await this.activity.log({
      userId: admin.id,
      action: 'USER_REACTIVATED',
      metadata: { targetUserId: userId },
    });

    return {
      success: true,
      data: { user: { id: updated.id, status: updated.status } },
    };
  }

  async revokeVerification(admin: AuthUser, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isVerified) {
      throw new BadRequestException('User is not verified');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: false },
    });

    await this.notifications.notify({
      userId,
      type: NotificationType.VERIFICATION,
      title: 'Verification revoked',
      message: 'An administrator removed your verified badge',
    });
    await this.activity.log({
      userId: admin.id,
      action: 'VERIFICATION_REVOKED',
      metadata: { targetUserId: userId },
    });

    return { success: true, data: { user: { id: userId, isVerified: false } } };
  }

  async listOpenReports(query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 100);
    const where = {
      status: { in: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW] },
    };
    const [total, items] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          reportedUser: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.map((r) => this.serializeReport(r)),
        page,
        pageSize,
        total,
      },
    };
  }

  async resolveReport(admin: AuthUser, id: string) {
    const report = await this.requireOpenReport(id);
    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedById: admin.id,
        resolvedAt: new Date(),
      },
    });
    await this.activity.log({
      userId: admin.id,
      action: 'REPORT_RESOLVED',
      metadata: { reportId: id },
    });
    await this.notifications.notify({
      userId: report.reporterId,
      type: NotificationType.SYSTEM,
      title: 'Report resolved',
      message: 'An admin reviewed your report and took action',
      metadata: { reportId: id },
    });
    return { success: true, data: { report: this.serializeReport(updated) } };
  }

  async dismissReport(admin: AuthUser, id: string) {
    const report = await this.requireOpenReport(id);
    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.DISMISSED,
        resolvedById: admin.id,
        resolvedAt: new Date(),
      },
    });
    await this.activity.log({
      userId: admin.id,
      action: 'REPORT_DISMISSED',
      metadata: { reportId: id },
    });
    await this.notifications.notify({
      userId: report.reporterId,
      type: NotificationType.SYSTEM,
      title: 'Report dismissed',
      message: 'An admin reviewed your report and found no violation',
      metadata: { reportId: id },
    });
    return { success: true, data: { report: this.serializeReport(updated) } };
  }

  async markReportUnderReview(admin: AuthUser, id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (
      report.status !== ReportStatus.OPEN &&
      report.status !== ReportStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Report is already closed');
    }
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: ReportStatus.UNDER_REVIEW },
    });
    await this.activity.log({
      userId: admin.id,
      action: 'REPORT_UNDER_REVIEW',
      metadata: { reportId: id },
    });
    return { success: true, data: { report: this.serializeReport(updated) } };
  }

  async listReviews() {
    const items = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        designer: { select: { id: true, name: true, email: true } },
      },
    });
    return {
      success: true,
      data: {
        items: items.map((r) => ({
          id: r.id,
          projectId: r.projectId,
          reviewerId: r.reviewerId,
          designerId: r.designerId,
          rating: r.rating,
          comment: r.comment,
          isVisible: r.isVisible,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          reviewer: r.reviewer ?? null,
          designer: r.designer ?? null,
        })),
      },
    };
  }

  async setReviewVisibility(admin: AuthUser, id: string, isVisible: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    const updated = await this.prisma.review.update({
      where: { id },
      data: { isVisible },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await this.activity.log({
      userId: admin.id,
      action: isVisible ? 'REVIEW_SHOWN' : 'REVIEW_HIDDEN',
      metadata: { reviewId: id },
    });
    return {
      success: true,
      data: {
        review: {
          id: updated.id,
          projectId: updated.projectId,
          reviewerId: updated.reviewerId,
          designerId: updated.designerId,
          rating: updated.rating,
          comment: updated.comment,
          isVisible: updated.isVisible,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          reviewer: updated.reviewer ?? null,
        },
      },
    };
  }

  private async requireOpenReport(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (
      report.status !== ReportStatus.OPEN &&
      report.status !== ReportStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Report is already closed');
    }
    return report;
  }

  async listActivity(query: PaginationQueryDto) {
    const { page, pageSize } = paginate(query);
    const { items, total } = await this.activity.listRecent(page, pageSize);
    return { success: true, data: { items, page, pageSize, total } };
  }

  private serializeReport(r: {
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
    reporter?: { id: string; name: string; email: string };
    reportedUser?: { id: string; name: string; email: string } | null;
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
      reporter: r.reporter ?? null,
      reportedUser: r.reportedUser ?? null,
    };
  }
}
