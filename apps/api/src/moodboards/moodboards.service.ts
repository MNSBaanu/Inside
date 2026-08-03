import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddMoodboardItemDto,
  CreateMoodboardDto,
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
    items.push({
      imageUrl: dto.imageUrl,
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      ...(dto.portfolioId !== undefined
        ? { portfolioId: dto.portfolioId }
        : {}),
    });
    const updated = await this.prisma.moodboard.update({
      where: { id },
      data: { savedItems: this.toJson(items) },
    });
    return { success: true, data: { moodboard: this.serialize(updated) } };
  }

  async removeItem(user: AuthUser, id: string, index: number) {
    const moodboard = await this.requireOwned(id, user.id);
    const items = this.asItems(moodboard.savedItems);
    if (index < 0 || index >= items.length) {
      throw new NotFoundException('Moodboard item not found');
    }
    items.splice(index, 1);
    const updated = await this.prisma.moodboard.update({
      where: { id },
      data: { savedItems: this.toJson(items) },
    });
    return { success: true, data: { moodboard: this.serialize(updated) } };
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
    createdAt: Date;
    updatedAt: Date;
    _count?: { briefs: number };
  }) {
    return {
      id: moodboard.id,
      clientId: moodboard.clientId,
      name: moodboard.name,
      savedItems: this.asItems(moodboard.savedItems),
      createdAt: moodboard.createdAt,
      updatedAt: moodboard.updatedAt,
      ...(moodboard._count ? { briefCount: moodboard._count.briefs } : {}),
    };
  }
}
