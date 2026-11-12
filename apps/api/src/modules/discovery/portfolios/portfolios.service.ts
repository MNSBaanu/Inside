import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountStatus, Prisma } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { AddPortfolioImageDto } from './dto/add-portfolio-image.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { ListPortfoliosQueryDto } from './dto/list-portfolios-query.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

const portfolioInclude = {
  images: { orderBy: { displayOrder: 'asc' as const } },
  designer: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      location: true,
      isVerified: true,
    },
  },
} satisfies Prisma.PortfolioInclude;

@Injectable()
export class PortfoliosService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: ListPortfoliosQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 50);
    const where: Prisma.PortfolioWhereInput = {
      isPublished: true,
      designer: {
        status: AccountStatus.ACTIVE,
        ...(query.location
          ? { location: { contains: query.location, mode: 'insensitive' } }
          : {}),
      },
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              {
                designer: {
                  name: { contains: query.q, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(query.style
        ? { style: { equals: query.style, mode: 'insensitive' } }
        : {}),
      ...(query.roomType
        ? { roomType: { equals: query.roomType, mode: 'insensitive' } }
        : {}),
      ...(query.designerId ? { designerId: query.designerId } : {}),
      ...((query.minBudget !== undefined || query.maxBudget !== undefined) && {
        budget: {
          ...(query.minBudget !== undefined ? { gte: query.minBudget } : {}),
          ...(query.maxBudget !== undefined ? { lte: query.maxBudget } : {}),
        },
      }),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.portfolio.count({ where }),
      this.prisma.portfolio.findMany({
        where,
        include: portfolioInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((p) => this.serialize(p)),
        page,
        pageSize,
        total,
      },
    };
  }

  async listMine(user: AuthUser) {
    const items = await this.prisma.portfolio.findMany({
      where: { designerId: user.id },
      include: portfolioInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: { items: items.map((p) => this.serialize(p)) },
    };
  }

  async getById(id: string, viewer?: AuthUser) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: portfolioInclude,
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    const isOwner = viewer?.id === portfolio.designerId;
    const isVisible =
      isOwner ||
      (portfolio.isPublished &&
        (await this.prisma.user.count({
          where: { id: portfolio.designerId, status: AccountStatus.ACTIVE },
        })) > 0);
    if (!isVisible) {
      throw new NotFoundException('Portfolio not found');
    }
    return { success: true, data: { portfolio: this.serialize(portfolio) } };
  }

  async create(user: AuthUser, dto: CreatePortfolioDto) {
    const portfolio = await this.prisma.portfolio.create({
      data: {
        designerId: user.id,
        title: dto.title,
        description: dto.description,
        style: dto.style,
        roomType: dto.roomType,
        budget: dto.budget,
        isPublished: dto.isPublished ?? true,
        images: dto.images?.length
          ? {
              create: dto.images.map((img, index) => ({
                imageUrl: img.imageUrl,
                caption: img.caption,
                displayOrder: img.displayOrder ?? index,
              })),
            }
          : undefined,
      },
      include: portfolioInclude,
    });

    return {
      success: true,
      data: { portfolio: this.serialize(portfolio) },
    };
  }

  async update(user: AuthUser, id: string, dto: UpdatePortfolioDto) {
    await this.requireOwned(id, user.id);
    const portfolio = await this.prisma.portfolio.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.style !== undefined ? { style: dto.style } : {}),
        ...(dto.roomType !== undefined ? { roomType: dto.roomType } : {}),
        ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: dto.isPublished }
          : {}),
      },
      include: portfolioInclude,
    });
    return {
      success: true,
      data: { portfolio: this.serialize(portfolio) },
    };
  }

  async remove(user: AuthUser, id: string) {
    await this.requireOwned(id, user.id);
    await this.prisma.portfolio.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  }

  async addImage(
    user: AuthUser,
    portfolioId: string,
    dto: AddPortfolioImageDto,
  ) {
    await this.requireOwned(portfolioId, user.id);
    const image = await this.prisma.portfolioImage.create({
      data: {
        portfolioId,
        imageUrl: dto.imageUrl,
        caption: dto.caption,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
    return { success: true, data: { image: this.serializeImage(image) } };
  }

  async removeImage(user: AuthUser, portfolioId: string, imageId: string) {
    await this.requireOwned(portfolioId, user.id);
    const image = await this.prisma.portfolioImage.findFirst({
      where: { id: imageId, portfolioId },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    await this.prisma.portfolioImage.delete({ where: { id: imageId } });
    return { success: true, data: { deleted: true } };
  }

  private async requireOwned(portfolioId: string, designerId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    if (portfolio.designerId !== designerId) {
      throw new ForbiddenException('You do not own this portfolio');
    }
    return portfolio;
  }

  private serialize(
    portfolio: Prisma.PortfolioGetPayload<{ include: typeof portfolioInclude }>,
  ) {
    return {
      id: portfolio.id,
      designerId: portfolio.designerId,
      title: portfolio.title,
      description: portfolio.description,
      style: portfolio.style,
      roomType: portfolio.roomType,
      budget: portfolio.budget === null ? null : Number(portfolio.budget),
      isPublished: portfolio.isPublished,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      designer: portfolio.designer,
      images: portfolio.images.map((img) => this.serializeImage(img)),
    };
  }

  private serializeImage(image: {
    id: string;
    portfolioId: string;
    imageUrl: string;
    caption: string | null;
    displayOrder: number;
    createdAt: Date;
  }) {
    return {
      id: image.id,
      portfolioId: image.portfolioId,
      imageUrl: image.imageUrl,
      caption: image.caption,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt,
    };
  }
}
