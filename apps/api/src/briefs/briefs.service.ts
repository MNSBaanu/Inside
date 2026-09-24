import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
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
    const saved = await this.savedPortfolioTags(moodboard.savedItems);
    const styles = dto.styles?.length
      ? dto.styles
      : saved.styles.length
        ? saved.styles
        : ['Mixed'];
    const rooms = dto.rooms?.length
      ? dto.rooms
      : saved.rooms.length
        ? saved.rooms
        : ['General'];
    const description =
      dto.description ??
      (notes.length
        ? `Generated from moodboard "${moodboard.name}": ${notes.join('; ')}`
        : `Generated from moodboard "${moodboard.name}".`);

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

  /**
   * Styles and room types of the portfolios saved on a moodboard, most
   * frequent first, so a generated brief can be matched against designers.
   */
  private async savedPortfolioTags(savedItems: unknown) {
    const ids = Array.isArray(savedItems)
      ? savedItems
          .map((item: unknown) =>
            item &&
            typeof item === 'object' &&
            typeof (item as { portfolioId?: unknown }).portfolioId === 'string'
              ? (item as { portfolioId: string }).portfolioId
              : null,
          )
          .filter((id): id is string => id !== null)
      : [];
    if (!ids.length) {
      return { styles: [], rooms: [] };
    }

    const portfolios = await this.prisma.portfolio.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: { id: true, style: true, roomType: true },
    });
    const byId = new Map(portfolios.map((p) => [p.id, p]));
    const saved = ids.flatMap((id) => byId.get(id) ?? []);

    return {
      styles: this.byFrequency(saved.map((p) => p.style)),
      rooms: this.byFrequency(saved.map((p) => p.roomType)),
    };
  }

  /** Distinct values (case-insensitive), most frequent first. */
  private byFrequency(values: string[]) {
    const counts = new Map<string, { value: string; count: number }>();
    for (const value of values) {
      const key = value.trim().toLowerCase();
      if (!key) continue;
      const entry = counts.get(key) ?? { value: value.trim(), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.value);
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
