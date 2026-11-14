import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateBriefDto,
  GenerateBriefDto,
  UpdateBriefDto,
} from './dto/brief.dto';

@Injectable()
export class BriefsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: AuthUser) {
    const items = await this.prisma.brief.findMany({
      where: { clientId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        moodboard: { select: { id: true, name: true } },
      },
    });
    return {
      success: true,
      data: { items: items.map((b) => this.serialize(b)) },
    };
  }

  async getById(user: AuthUser, id: string) {
    const brief = await this.requireOwned(id, user.id);
    return { success: true, data: { brief: this.serialize(brief) } };
  }

  async create(user: AuthUser, dto: CreateBriefDto) {
    if (dto.moodboardId) {
      await this.requireMoodboardOwned(dto.moodboardId, user.id);
    }
    if (!dto.styles.length || !dto.rooms.length) {
      throw new BadRequestException('styles and rooms are required');
    }
    await this.assertNotDuplicate(user.id, dto);

    const brief = await this.prisma.brief.create({
      data: {
        clientId: user.id,
        moodboardId: dto.moodboardId,
        styles: dto.styles,
        rooms: dto.rooms,
        budgetRange: dto.budgetRange,
        description: dto.description,
      },
      include: {
        moodboard: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: { brief: this.serialize(brief) } };
  }

  async generateFromMoodboard(
    user: AuthUser,
    moodboardId: string,
    dto: GenerateBriefDto,
  ) {
    const moodboard = await this.requireMoodboardOwned(moodboardId, user.id);
    const notes = this.extractNotes(moodboard.savedItems);
    const styles = dto.styles?.length ? dto.styles : ['Mixed'];
    const rooms = dto.rooms?.length ? dto.rooms : ['General'];
    const description =
      dto.description ??
      (notes.length
        ? `Generated from moodboard "${moodboard.name}": ${notes.join('; ')}`
        : `Generated from moodboard "${moodboard.name}".`);
    await this.assertNotDuplicate(user.id, {
      styles,
      rooms,
      budgetRange: dto.budgetRange,
      description,
    });

    const brief = await this.prisma.brief.create({
      data: {
        clientId: user.id,
        moodboardId,
        styles,
        rooms,
        budgetRange: dto.budgetRange,
        description,
      },
      include: {
        moodboard: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: { brief: this.serialize(brief) } };
  }

  async update(user: AuthUser, id: string, dto: UpdateBriefDto) {
    await this.requireOwned(id, user.id);
    if (dto.moodboardId) {
      await this.requireMoodboardOwned(dto.moodboardId, user.id);
    }

    const brief = await this.prisma.brief.update({
      where: { id },
      data: {
        ...(dto.styles !== undefined ? { styles: dto.styles } : {}),
        ...(dto.rooms !== undefined ? { rooms: dto.rooms } : {}),
        ...(dto.budgetRange !== undefined
          ? { budgetRange: dto.budgetRange }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.moodboardId !== undefined
          ? { moodboardId: dto.moodboardId }
          : {}),
      },
      include: {
        moodboard: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: { brief: this.serialize(brief) } };
  }

  async remove(user: AuthUser, id: string) {
    await this.requireOwned(id, user.id);
    await this.prisma.brief.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  }

  private async assertNotDuplicate(
    clientId: string,
    brief: {
      styles: string[];
      rooms: string[];
      budgetRange?: string | null;
      description?: string | null;
    },
  ) {
    const key = (b: typeof brief) =>
      JSON.stringify([
        [...b.styles].map((s) => s.trim().toLowerCase()).sort(),
        [...b.rooms].map((r) => r.trim().toLowerCase()).sort(),
        (b.budgetRange ?? '').trim().toLowerCase(),
        (b.description ?? '').trim().toLowerCase(),
      ]);
    const existing = await this.prisma.brief.findMany({
      where: { clientId },
      select: {
        styles: true,
        rooms: true,
        budgetRange: true,
        description: true,
      },
    });
    const target = key(brief);
    if (existing.some((b) => key(b) === target)) {
      throw new ConflictException(
        'You already have a brief with the same rooms, styles, budget and description.',
      );
    }
  }

  private async requireOwned(id: string, clientId: string) {
    const brief = await this.prisma.brief.findUnique({
      where: { id },
      include: {
        moodboard: { select: { id: true, name: true } },
      },
    });
    if (!brief) {
      throw new NotFoundException('Brief not found');
    }
    if (brief.clientId !== clientId) {
      throw new ForbiddenException('You do not own this brief');
    }
    return brief;
  }

  private async requireMoodboardOwned(moodboardId: string, clientId: string) {
    const moodboard = await this.prisma.moodboard.findUnique({
      where: { id: moodboardId },
    });
    if (!moodboard) {
      throw new NotFoundException('Moodboard not found');
    }
    if (moodboard.clientId !== clientId) {
      throw new ForbiddenException('You do not own this moodboard');
    }
    return moodboard;
  }

  private extractNotes(savedItems: unknown): string[] {
    if (!Array.isArray(savedItems)) {
      return [];
    }
    return savedItems
      .map((item) => {
        if (
          item &&
          typeof item === 'object' &&
          'note' in item &&
          typeof (item as { note?: unknown }).note === 'string'
        ) {
          return (item as { note: string }).note;
        }
        return null;
      })
      .filter((note): note is string => Boolean(note));
  }

  private serialize(brief: {
    id: string;
    clientId: string;
    moodboardId: string | null;
    styles: string[];
    rooms: string[];
    budgetRange: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    moodboard?: { id: string; name: string } | null;
  }) {
    return {
      id: brief.id,
      clientId: brief.clientId,
      moodboardId: brief.moodboardId,
      styles: brief.styles,
      rooms: brief.rooms,
      budgetRange: brief.budgetRange,
      description: brief.description,
      createdAt: brief.createdAt,
      updatedAt: brief.updatedAt,
      moodboard: brief.moodboard ?? null,
    };
  }
}
