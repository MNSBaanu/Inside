import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';

const blockedSelect = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: AuthUser) {
    const items = await this.prisma.block.findMany({
      where: { blockerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { blocked: { select: blockedSelect } },
    });
    return {
      success: true,
      data: { items: items.map((b) => this.serialize(b)) },
    };
  }

  async create(user: AuthUser, dto: CreateBlockDto) {
    if (dto.blockedId === user.id) {
      throw new BadRequestException('Cannot block yourself');
    }
    const other = await this.prisma.user.findUnique({
      where: { id: dto.blockedId },
    });
    if (!other) {
      throw new NotFoundException('User not found');
    }

    try {
      const block = await this.prisma.block.create({
        data: {
          blockerId: user.id,
          blockedId: dto.blockedId,
          reason: dto.reason,
        },
        include: { blocked: { select: blockedSelect } },
      });
      return { success: true, data: { block: this.serialize(block) } };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User is already blocked');
      }
      throw error;
    }
  }

  async remove(user: AuthUser, blockedId: string) {
    const existing = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: user.id, blockedId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Block not found');
    }
    await this.prisma.block.delete({ where: { id: existing.id } });
    return { success: true, data: { deleted: true } };
  }

  private serialize(b: {
    id: string;
    blockerId: string;
    blockedId: string;
    reason: string | null;
    createdAt: Date;
    blocked?: { id: string; name: string; avatarUrl: string | null };
  }) {
    return {
      id: b.id,
      blockerId: b.blockerId,
      blockedId: b.blockedId,
      reason: b.reason,
      createdAt: b.createdAt,
      blocked: b.blocked ?? null,
    };
  }
}
