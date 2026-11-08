import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { BlocksService } from '../../trust/blocks/blocks.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateFavouriteDto } from './dto/create-favourite.dto';

const designerSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  location: true,
  bio: true,
  isVerified: true,
  isAvailable: true,
} as const;

@Injectable()
export class FavouritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  async listMine(user: AuthUser) {
    const items = await this.prisma.favourite.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { designer: { select: designerSelect } },
    });
    return {
      success: true,
      data: {
        items: items.map((fav) => this.serialize(fav)),
      },
    };
  }

  async create(user: AuthUser, dto: CreateFavouriteDto) {
    if (dto.designerId === user.id) {
      throw new BadRequestException('Cannot favourite yourself');
    }

    const designer = await this.prisma.user.findUnique({
      where: { id: dto.designerId },
    });
    if (!designer || designer.role !== Role.DESIGNER) {
      throw new NotFoundException('Designer not found');
    }

    await this.blocks.assertNotBlocked(user.id, dto.designerId);

    try {
      const favourite = await this.prisma.favourite.create({
        data: {
          clientId: user.id,
          designerId: dto.designerId,
        },
        include: { designer: { select: designerSelect } },
      });
      return {
        success: true,
        data: { favourite: this.serialize(favourite) },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Designer is already in your favourites');
      }
      throw error;
    }
  }

  async removeByDesignerId(user: AuthUser, designerId: string) {
    const favourite = await this.prisma.favourite.findUnique({
      where: {
        clientId_designerId: {
          clientId: user.id,
          designerId,
        },
      },
    });
    if (!favourite) {
      throw new NotFoundException('Favourite not found');
    }
    await this.prisma.favourite.delete({ where: { id: favourite.id } });
    return { success: true, data: { deleted: true } };
  }

  private serialize(favourite: {
    id: string;
    clientId: string;
    designerId: string;
    createdAt: Date;
    designer: {
      id: string;
      name: string;
      avatarUrl: string | null;
      location: string | null;
      bio: string | null;
      isVerified: boolean;
      isAvailable: boolean;
    };
  }) {
    return {
      id: favourite.id,
      clientId: favourite.clientId,
      designerId: favourite.designerId,
      createdAt: favourite.createdAt,
      designer: favourite.designer,
    };
  }
}
