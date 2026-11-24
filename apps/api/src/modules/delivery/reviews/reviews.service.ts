import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  NotificationType,
  Prisma,
  ProjectStatus,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import {
  PaginationQueryDto,
  paginate,
} from '../../../common/dto/pagination-query.dto';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { serializeReview } from './review.serializer';

const reviewerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthUser, projectId: string, dto: CreateReviewDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        clientId: true,
        designerId: true,
        status: true,
        title: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can review this project');
    }
    if (project.designerId === user.id) {
      throw new ForbiddenException('You cannot review your own work');
    }
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException('Only completed projects can be reviewed');
    }

    try {
      const created = await this.prisma.review.create({
        data: {
          projectId,
          reviewerId: user.id,
          designerId: project.designerId,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: { reviewer: { select: reviewerSelect } },
      });

      await this.notifications.notify({
        userId: project.designerId,
        type: NotificationType.REVIEW,
        title: 'New review',
        message: `You received a ${dto.rating}-star review`,
        metadata: { projectId, reviewId: created.id },
      });

      return { success: true, data: { review: serializeReview(created) } };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You already reviewed this project');
      }
      throw error;
    }
  }

  async listByDesigner(designerId: string, query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = paginate(query);
    const designer = await this.prisma.user.findUnique({
      where: { id: designerId },
      select: { id: true, role: true, status: true },
    });
    if (
      !designer ||
      designer.role !== Role.DESIGNER ||
      designer.status !== AccountStatus.ACTIVE
    ) {
      throw new NotFoundException('Designer not found');
    }

    return this.listWhere(
      { designerId, isVisible: true },
      page,
      pageSize,
      skip,
      take,
    );
  }

  async listByPortfolio(portfolioId: string, query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = paginate(query);
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { isPublished: true },
    });
    if (!portfolio?.isPublished) {
      throw new NotFoundException('Portfolio project not found');
    }

    return this.listWhere(
      {
        isVisible: true,
        project: {
          OR: [
            { proposal: { request: { portfolioId } } },
            { portfolio: { id: portfolioId } },
          ],
        },
      },
      page,
      pageSize,
      skip,
      take,
    );
  }

  private async listWhere(
    where: Prisma.ReviewWhereInput,
    page: number,
    pageSize: number,
    skip: number,
    take: number,
  ) {
    const items = await this.prisma.review.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { reviewer: { select: reviewerSelect } },
      skip,
      take,
    });

    const aggregate = await this.prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      success: true,
      data: {
        items: items.map(serializeReview),
        page,
        pageSize,
        summary: {
          count: aggregate._count._all,
          averageRating: aggregate._avg.rating ?? 0,
        },
      },
    };
  }
}
