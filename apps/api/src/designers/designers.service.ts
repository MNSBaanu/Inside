import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, Prisma, Role } from '@inside/database';
import { PrismaService } from '../prisma/prisma.service';
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
      ...(query.verifiedOnly === 'true' ? { isVerified: true } : {}),
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

    const ratings = await this.ratingsFor(designers.map((d) => d.id));

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
        })),
        page,
        pageSize,
        total,
      },
    };
  }

  async getById(id: string) {
    const designer = await this.prisma.user.findFirst({
      where: { id, role: Role.DESIGNER, status: AccountStatus.ACTIVE },
      select: designerSelect,
    });
    if (!designer) {
      throw new NotFoundException('Designer not found');
    }

    const portfolios = await this.prisma.portfolio.findMany({
      where: { designerId: id, isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { displayOrder: 'asc' } } },
    });

    const ratings = await this.ratingsFor([id]);

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
