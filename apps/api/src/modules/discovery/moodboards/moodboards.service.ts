import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MoodboardStatus,
  NotificationType,
  Prisma,
  type Moodboard,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { likedImages } from '../../../common/moodboard';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import {
  AddMoodboardItemDto,
  CreateMoodboardDto,
  MAX_MOODBOARD_ITEMS,
  MoodboardItemDto,
  UpdateMoodboardDto,
} from './dto/moodboard.dto';

@Injectable()
export class MoodboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
    this.assertNew([], dto.savedItems ?? []);
    const moodboard = await this.prisma.moodboard.create({
      data: {
        clientId: user.id,
        name: dto.name,
        savedItems: this.toJson(dto.savedItems ?? []),
        moodWords: dto.moodWords ?? [],
        palette: dto.palette ?? [],
      },
    });
    return { success: true, data: { moodboard: this.serialize(moodboard) } };
  }

  async update(user: AuthUser, id: string, dto: UpdateMoodboardDto) {
    const original = await this.requireOwned(id, user.id);
    if (dto.savedItems) {
      const kept = new Set(
        this.asItems(original.savedItems).map((item) => item.imageUrl),
      );
      this.assertNew(
        dto.savedItems.filter((item) => kept.has(item.imageUrl)),
        dto.savedItems.filter((item) => !kept.has(item.imageUrl)),
      );
    }
    const target = await this.writable(original);
    const moodboard = await this.prisma.moodboard.update({
      where: { id: target.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.savedItems !== undefined
          ? { savedItems: this.toJson(dto.savedItems) }
          : {}),
        ...(dto.moodWords !== undefined ? { moodWords: dto.moodWords } : {}),
        ...(dto.palette !== undefined ? { palette: dto.palette } : {}),
      },
    });
    return this.edited(user, moodboard);
  }

  async remove(user: AuthUser, id: string) {
    const moodboard = await this.requireOwned(id, user.id);
    if (moodboard.status === MoodboardStatus.APPROVED) {
      throw new ConflictException(
        'A designer approved this moodboard, so it cannot be deleted',
      );
    }
    await this.prisma.moodboard.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  }

  async addItem(user: AuthUser, id: string, dto: AddMoodboardItemDto) {
    const original = await this.requireOwned(id, user.id);
    if (this.asItems(original.savedItems).length >= MAX_MOODBOARD_ITEMS) {
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
    let item: MoodboardItemDto;
    if (dto.productSlug) {
      const product = await this.prisma.product.findFirst({
        where: { slug: dto.productSlug, isPublished: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      item = {
        imageUrl: product.imageUrl,
        note: product.name,
        productSlug: product.slug,
        productPrice: Number(product.price),
      };
    } else {
      item = {
        imageUrl: dto.imageUrl,
        ...(dto.fileHash !== undefined ? { fileHash: dto.fileHash } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.portfolioId !== undefined
          ? { portfolioId: dto.portfolioId }
          : {}),
      };
    }
    this.assertNew(this.asItems(original.savedItems), [item]);
    const moodboard = await this.writable(original);
    const items = [...this.asItems(moodboard.savedItems), item];
    return this.edited(user, await this.saveItems(moodboard, items));
  }

  /** Stops the same image, by address or by file contents, going on a board twice. */
  private assertNew(existing: MoodboardItemDto[], added: MoodboardItemDto[]) {
    const keys = new Set(
      existing.flatMap((item) => [
        item.imageUrl,
        ...(item.fileHash ? [item.fileHash] : []),
      ]),
    );
    for (const item of added) {
      const itemKeys = [
        item.imageUrl,
        ...(item.fileHash ? [item.fileHash] : []),
      ];
      if (itemKeys.some((key) => keys.has(key))) {
        throw new ConflictException('This image is already on the moodboard');
      }
      itemKeys.forEach((key) => keys.add(key));
    }
  }

  async removeItem(user: AuthUser, id: string, index: number) {
    const original = await this.requireOwned(id, user.id);
    if (index < 0 || index >= this.asItems(original.savedItems).length) {
      throw new NotFoundException('Moodboard item not found');
    }
    const moodboard = await this.writable(original);
    const items = this.asItems(moodboard.savedItems);
    items.splice(index, 1);
    return this.edited(user, await this.saveItems(moodboard, items));
  }

  /**
   * A moodboard a designer approved stays as it is. Editing it starts a new
   * version, grouped under the original, and the edit goes there instead.
   */
  private async writable(moodboard: Moodboard) {
    if (moodboard.status !== MoodboardStatus.APPROVED) {
      return moodboard;
    }
    const rootId = moodboard.parentId ?? moodboard.id;
    const latest = await this.prisma.moodboard.aggregate({
      where: { OR: [{ id: rootId }, { parentId: rootId }] },
      _max: { version: true },
    });
    return this.prisma.moodboard.create({
      data: {
        clientId: moodboard.clientId,
        name: moodboard.name,
        savedItems: this.toJson(moodboard.savedItems),
        moodWords: moodboard.moodWords,
        palette: moodboard.palette,
        parentId: rootId,
        version: (latest._max.version ?? moodboard.version) + 1,
      },
    });
  }

  /**
   * While a designer is reviewing a board on a request, the request's copy
   * follows the client's edits. The first edit after a change request tells
   * the designer the board is ready to look at again.
   */
  private async edited(user: AuthUser, moodboard: Moodboard) {
    if (
      moodboard.reviewRequestId &&
      moodboard.status !== MoodboardStatus.APPROVED
    ) {
      const request = await this.prisma.projectRequest.findUnique({
        where: { id: moodboard.reviewRequestId },
        select: {
          id: true,
          title: true,
          designerId: true,
          briefSnapshot: true,
        },
      });
      const snapshot = request?.briefSnapshot as
        { moodboard?: { id?: string } | null } | null | undefined;
      if (request && snapshot?.moodboard?.id === moodboard.id) {
        await this.prisma.projectRequest.update({
          where: { id: request.id },
          data: {
            briefSnapshot: this.toJson({
              ...snapshot,
              moodboard: {
                id: moodboard.id,
                name: moodboard.name,
                moodWords: moodboard.moodWords,
                palette: moodboard.palette,
                images: likedImages(moodboard.savedItems),
              },
            }),
          },
        });
        if (moodboard.status === MoodboardStatus.CHANGES_REQUESTED) {
          moodboard = await this.prisma.moodboard.update({
            where: { id: moodboard.id },
            data: { status: MoodboardStatus.OPEN, reviewNote: null },
          });
          if (request.designerId) {
            await this.notifications.notify({
              userId: request.designerId,
              type: NotificationType.REQUEST,
              title: 'Moodboard updated',
              message: `${user.name} updated the moodboard "${moodboard.name}" for "${request.title}"`,
              metadata: { requestId: request.id },
            });
          }
        }
      }
    }
    return { success: true, data: { moodboard: this.serialize(moodboard) } };
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

  private serialize(moodboard: Moodboard & { _count?: { briefs: number } }) {
    return {
      id: moodboard.id,
      clientId: moodboard.clientId,
      name: moodboard.name,
      savedItems: this.asItems(moodboard.savedItems),
      moodWords: moodboard.moodWords,
      palette: moodboard.palette,
      status: moodboard.status,
      reviewNote: moodboard.reviewNote,
      parentId: moodboard.parentId,
      version: moodboard.version,
      createdAt: moodboard.createdAt,
      updatedAt: moodboard.updatedAt,
      ...(moodboard._count ? { briefCount: moodboard._count.briefs } : {}),
    };
  }
}
