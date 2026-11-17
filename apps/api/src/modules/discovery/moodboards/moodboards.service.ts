import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  AddMoodboardItemDto,
  CreateMoodboardDto,
  MAX_MOODBOARD_ITEMS,
  MoodboardItemDto,
  UpdateMoodboardDto,
} from './dto/moodboard.dto';

@Injectable()
export class MoodboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: AuthUser) {
    const items = await this.prisma.moodboard.findMany({
      where: { clientId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { briefs: true } } },
    });
    return {
      success: true,
      data: { items: items.map((m) => this.serialize(m)) },
    };
  }

  async getById(user: AuthUser, id: string) {
    const moodboard = await this.requireOwned(id, user.id);
    return { success: true, data: { moodboard: this.serialize(moodboard) } };
  }

  async create(user: AuthUser, dto: CreateMoodboardDto) {
    const moodboard = await this.prisma.moodboard.create({
      data: {
        clientId: user.id,
        name: dto.name,
        savedItems: this.toJson(dto.savedItems ?? []),
      },
    });
    return { success: true, data: { moodboard: this.serialize(moodboard) } };
  }

  async update(user: AuthUser, id: string, dto: UpdateMoodboardDto) {
    await this.requireOwned(id, user.id);
    const moodboard = await this.prisma.moodboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.savedItems !== undefined
          ? { savedItems: this.toJson(dto.savedItems) }
          : {}),
        ...(dto.moodWords !== undefined ? { moodWords: dto.moodWords } : {}),
        ...(dto.palette !== undefined ? { palette: dto.palette } : {}),
      },
    });
    return { success: true, data: { moodboard: this.serialize(moodboard) } };
  }

  async remove(user: AuthUser, id: string) {
    await this.requireOwned(id, user.id);
    await this.prisma.moodboard.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  }

  async addItem(user: AuthUser, id: string, dto: AddMoodboardItemDto) {
    const moodboard = await this.requireOwned(id, user.id);
    const items = this.asItems(moodboard.savedItems);
    if (items.length >= MAX_MOODBOARD_ITEMS) {
      throw new BadRequestException(
        `A moodboard can hold up to ${MAX_MOODBOARD_ITEMS} items`,
      );
    }
    if (dto.portfolioId) {
      const portfolios = await this.prisma.portfolio.count({
        where: { id: dto.portfolioId, isPublished: true },
      });
      if (portfolios === 0) {
        throw new NotFoundException('Portfolio not found');
      }
    }
    if (dto.productSlug) {
      const product = await this.prisma.product.findFirst({
        where: { slug: dto.productSlug, isPublished: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      items.push({
        imageUrl: product.imageUrl,
        note: product.name,
        productSlug: product.slug,
        productPrice: Number(product.price),
      });
      const updated = await this.saveItems(moodboard, items);
      return { success: true, data: { moodboard: this.serialize(updated) } };
    }
    items.push({
      imageUrl: dto.imageUrl,
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      ...(dto.portfolioId !== undefined
        ? { portfolioId: dto.portfolioId }
        : {}),
    });
    const updated = await this.saveItems(moodboard, items);
    return { success: true, data: { moodboard: this.serialize(updated) } };
  }

  async removeItem(user: AuthUser, id: string, index: number) {
    const moodboard = await this.requireOwned(id, user.id);
    const items = this.asItems(moodboard.savedItems);
    if (index < 0 || index >= items.length) {
      throw new NotFoundException('Moodboard item not found');
    }
    items.splice(index, 1);
    const updated = await this.saveItems(moodboard, items);
    return { success: true, data: { moodboard: this.serialize(updated) } };
  }

  /** Saves only if nobody changed the moodboard since it was read. */
  private async saveItems(
    moodboard: { id: string; updatedAt: Date },
    items: MoodboardItemDto[],
  ) {
    const { count } = await this.prisma.moodboard.updateMany({
      where: { id: moodboard.id, updatedAt: moodboard.updatedAt },
      data: { savedItems: this.toJson(items) },
    });
    if (count === 0) {
      throw new ConflictException(
        'This moodboard was changed elsewhere. Reload and try again.',
      );
    }
    return this.prisma.moodboard.findUniqueOrThrow({
      where: { id: moodboard.id },
    });
  }

  private async requireOwned(id: string, clientId: string) {
    const moodboard = await this.prisma.moodboard.findUnique({ where: { id } });
    if (!moodboard) {
      throw new NotFoundException('Moodboard not found');
    }
    if (moodboard.clientId !== clientId) {
      throw new ForbiddenException('You do not own this moodboard');
    }
    return moodboard;
  }

  private asItems(value: unknown): MoodboardItemDto[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value as MoodboardItemDto[];
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private serialize(moodboard: {
    id: string;
    clientId: string;
    name: string;
    savedItems: unknown;
    moodWords: string[];
    palette: string[];
    createdAt: Date;
    updatedAt: Date;
    _count?: { briefs: number };
  }) {
    return {
      id: moodboard.id,
      clientId: moodboard.clientId,
      name: moodboard.name,
      savedItems: this.asItems(moodboard.savedItems),
      moodWords: moodboard.moodWords,
      palette: moodboard.palette,
      createdAt: moodboard.createdAt,
      updatedAt: moodboard.updatedAt,
      ...(moodboard._count ? { briefCount: moodboard._count.briefs } : {}),
    };
  }
}
