import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, Prisma, Role } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import { ListDesignersQueryDto } from './dto/list-designers-query.dto';

const designerSelect = {
  id: true,
  name: true,
  bio: true,
  avatarUrl: true,
  location: true,
  isVerified: true,
  isAvailable: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class DesignersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListDesignersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 12, 50);

    const where: Prisma.UserWhereInput = {
      role: Role.DESIGNER,
      status: AccountStatus.ACTIVE,
      // Keep incomplete signup/QA accounts out of discovery. A published
      // portfolio gives new designers a route in without requiring verification.
      AND: [
        {
          OR: [
            { isVerified: true },
            { portfolios: { some: { isPublished: true } } },
          ],
        },
      ],
      ...(query.verifiedOnly === 'true' ? { isVerified: true } : {}),
      ...(query.availableOnly === 'true' ? { isAvailable: true } : {}),
      ...(query.location
        ? { location: { contains: query.location, mode: 'insensitive' } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { bio: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.style
        ? {
            portfolios: {
              some: {
                isPublished: true,
                style: { equals: query.style, mode: 'insensitive' },
              },
            },
          }
        : {}),
    };

    const [total, designers] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          ...designerSelect,
          portfolios: {
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
              id: true,
              title: true,
              style: true,
              images: {
                orderBy: { displayOrder: 'asc' },
                take: 1,
                select: { imageUrl: true },
              },
            },
          },
          _count: { select: { portfolios: { where: { isPublished: true } } } },
        },
        orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const ids = designers.map((d) => d.id);
    const [ratings, stats] = await Promise.all([
      this.ratingsFor(ids),
      this.workStatsFor(ids),
    ]);

    return {
      success: true,
      data: {
        items: designers.map((designer) => ({
          id: designer.id,
          name: designer.name,
          bio: designer.bio,
          avatarUrl: designer.avatarUrl,
          location: designer.location,
          isVerified: designer.isVerified,
          isAvailable: designer.isAvailable,
          portfolioCount: designer._count.portfolios,
          previews: designer.portfolios.map((portfolio) => ({
            id: portfolio.id,
            title: portfolio.title,
            style: portfolio.style,
            imageUrl: portfolio.images[0]?.imageUrl ?? null,
          })),
          rating: ratings.get(designer.id) ?? { average: null, count: 0 },
          specialities: stats.get(designer.id)?.specialities ?? [],
          startingBudget: stats.get(designer.id)?.startingBudget ?? null,
        })),
        page,
        pageSize,
        total,
      },
    };
  }

  async getById(id: string) {
    const [designer, portfolios, ratings] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id, role: Role.DESIGNER, status: AccountStatus.ACTIVE },
        select: designerSelect,
      }),
      this.prisma.portfolio.findMany({
        where: { designerId: id, isPublished: true },
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { displayOrder: 'asc' } } },
      }),
      this.ratingsFor([id]),
    ]);
    if (!designer) {
      throw new NotFoundException('Designer not found');
    }

    return {
      success: true,
      data: {
        designer: {
          ...designer,
          rating: ratings.get(id) ?? { average: null, count: 0 },
        },
        portfolios: portfolios.map((portfolio) => ({
          id: portfolio.id,
          title: portfolio.title,
          description: portfolio.description,
          style: portfolio.style,
          roomType: portfolio.roomType,
          budget: portfolio.budget === null ? null : Number(portfolio.budget),
          createdAt: portfolio.createdAt,
          images: portfolio.images.map((image) => ({
            id: image.id,
            imageUrl: image.imageUrl,
            caption: image.caption,
          })),
        })),
      },
    };
  }

  private async workStatsFor(designerIds: string[]) {
    const stats = new Map<
      string,
      { specialities: string[]; startingBudget: number | null }
    >();
    if (designerIds.length === 0) return stats;

    const work = await this.prisma.portfolio.findMany({
      where: { designerId: { in: designerIds }, isPublished: true },
      select: { designerId: true, style: true, budget: true },
    });

    for (const id of designerIds) {
      const mine = work.filter((item) => item.designerId === id);
      const styleCounts = new Map<string, number>();
      for (const item of mine) {
        if (item.style) {
          styleCounts.set(item.style, (styleCounts.get(item.style) ?? 0) + 1);
        }
      }
      const budgets = mine
        .filter((item) => item.budget !== null)
        .map((item) => Number(item.budget));

      stats.set(id, {
        specialities: [...styleCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([style]) => style),
        startingBudget: budgets.length > 0 ? Math.min(...budgets) : null,
      });
    }
    return stats;
  }

  private async ratingsFor(designerIds: string[]) {
    if (designerIds.length === 0) {
      return new Map<string, { average: number | null; count: number }>();
    }

    const grouped = await this.prisma.review.groupBy({
      by: ['designerId'],
      where: { designerId: { in: designerIds }, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return new Map(
      grouped.map((row) => [
        row.designerId,
        {
          average: row._avg.rating === null ? null : Number(row._avg.rating),
          count: row._count.rating,
        },
      ]),
    );
  }
}
