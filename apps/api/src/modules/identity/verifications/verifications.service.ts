import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, VerificationStatus } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import {
  PaginationQueryDto,
  paginate,
} from '../../../common/dto/pagination-query.dto';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateVerificationDto,
  RejectVerificationDto,
} from './dto/create-verification.dto';

const designerSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  isVerified: true,
} as const;

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async submit(user: AuthUser, dto: CreateVerificationDto) {
    if (user.isVerified) {
      throw new BadRequestException('You are already verified');
    }
    const pending = await this.prisma.verification.findFirst({
      where: {
        designerId: user.id,
        status: VerificationStatus.PENDING,
      },
    });
    if (pending) {
      throw new BadRequestException(
        'You already have a pending verification request',
      );
    }

    const created = await this.prisma.verification.create({
      data: {
        designerId: user.id,
        evidenceUrl: dto.evidenceUrl,
        notes: dto.notes,
      },
    });

    await this.notifications.notifyAdmins({
      type: NotificationType.VERIFICATION,
      title: 'New verification request',
      message: `${user.name} asked to be verified`,
      metadata: { verificationId: created.id, href: '/admin/verifications' },
    });

    return { success: true, data: { verification: this.serialize(created) } };
  }

  async listMine(user: AuthUser) {
    const items = await this.prisma.verification.findMany({
      where: { designerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: { items: items.map((v) => this.serialize(v)) },
    };
  }

  async listPending(query: PaginationQueryDto & { search?: string }) {
    const { page, pageSize, skip, take } = paginate(query, 20);
    const search = query.search?.trim();
    const where: Prisma.VerificationWhereInput = {
      status: VerificationStatus.PENDING,
      ...(search
        ? {
            OR: [
              { notes: { contains: search, mode: 'insensitive' } },
              {
                designer: { name: { contains: search, mode: 'insensitive' } },
              },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.verification.count({ where }),
      this.prisma.verification.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { designer: { select: designerSelect } },
        skip,
        take,
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.map((v) => this.serialize(v)),
        page,
        pageSize,
        total,
      },
    };
  }

  async approve(admin: AuthUser, id: string) {
    const verification = await this.requirePending(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.verification.update({
        where: { id },
        data: {
          status: VerificationStatus.APPROVED,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: verification.designerId },
        data: { isVerified: true },
      });
      return v;
    });

    await this.notifications.notify({
      userId: verification.designerId,
      type: NotificationType.VERIFICATION,
      title: 'Verification approved',
      message: 'Your designer verification was approved',
      metadata: { verificationId: id },
    });

    await this.activity.log({
      userId: admin.id,
      action: 'VERIFICATION_APPROVED',
      metadata: { verificationId: id, designerId: verification.designerId },
    });

    return { success: true, data: { verification: this.serialize(updated) } };
  }

  async reject(admin: AuthUser, id: string, dto: RejectVerificationDto) {
    const verification = await this.requirePending(id);

    const updated = await this.prisma.verification.update({
      where: { id },
      data: {
        status: VerificationStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNotes: dto.notes,
      },
    });

    await this.notifications.notify({
      userId: verification.designerId,
      type: NotificationType.VERIFICATION,
      title: 'Verification rejected',
      message: dto.notes
        ? `Verification rejected: ${dto.notes}`
        : 'Your verification request was rejected',
      metadata: { verificationId: id },
    });

    await this.activity.log({
      userId: admin.id,
      action: 'VERIFICATION_REJECTED',
      metadata: {
        verificationId: id,
        designerId: verification.designerId,
        notes: dto.notes ?? null,
      },
    });

    return { success: true, data: { verification: this.serialize(updated) } };
  }

  private async requirePending(id: string) {
    const v = await this.prisma.verification.findUnique({ where: { id } });
    if (!v) {
      throw new NotFoundException('Verification not found');
    }
    if (v.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verification is not pending');
    }
    return v;
  }

  private serialize(v: {
    id: string;
    designerId: string;
    status: VerificationStatus;
    evidenceUrl: string;
    notes: string | null;
    reviewNotes: string | null;
    reviewedById: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    designer?: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
      isVerified: boolean;
    };
  }) {
    return {
      id: v.id,
      designerId: v.designerId,
      status: v.status,
      evidenceUrl: v.evidenceUrl,
      notes: v.notes,
      reviewNotes: v.reviewNotes,
      reviewedById: v.reviewedById,
      reviewedAt: v.reviewedAt,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      designer: v.designer ?? null,
    };
  }
}
