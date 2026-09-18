import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  async matchDesigners(user: AuthUser, briefId: string) {
    const brief = await this.prisma.brief.findUnique({
      where: { id: briefId },
    });
    if (!brief || brief.clientId !== user.id) {
      throw new NotFoundException('Brief not found');
    }

    const blockedIds = await this.blocks.listBlockedCounterpartIds(user.id);
    const budget = this.parseBudgetMid(brief.budgetRange);

    // Only portfolios that can reach the minimum score: a style or room
    // match, or a budget within 50% of the brief.
    const relevant: Prisma.PortfolioWhereInput[] = [
      ...brief.styles.map((style) => ({
        style: { equals: style, mode: 'insensitive' as const },
      })),
      ...brief.rooms.map((room) => ({
        roomType: { equals: room, mode: 'insensitive' as const },
      })),
      ...(budget !== null
        ? [{ budget: { gte: budget * 0.5, lte: budget * 1.5 } }]
        : []),
    ];

    const portfolios = await this.prisma.portfolio.findMany({
      where: {
        isPublished: true,
        designer: { role: Role.DESIGNER, status: 'ACTIVE' },
        ...(blockedIds.size ? { designerId: { notIn: [...blockedIds] } } : {}),
        OR: relevant,
      },
      include: {
        designer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            location: true,
            isVerified: true,
            isAvailable: true,
            bio: true,
          },
        },
      },
    });

    const byDesigner = new Map<
      string,
      {
        designer: (typeof portfolios)[0]['designer'];
        score: number;
        breakdown: { style: number; room: number; budget: number };
        matchedPortfolios: {
          id: string;
          title: string;
          style: string;
          roomType: string;
        }[];
      }
    >();

    for (const p of portfolios) {
      const styleHit = brief.styles.some(
        (s) => s.toLowerCase() === p.style.toLowerCase(),
      );
      const roomHit = brief.rooms.some(
        (r) => r.toLowerCase() === p.roomType.toLowerCase(),
      );
      const style = styleHit ? 40 : 0;
      const room = roomHit ? 35 : 0;
      let budgetScore = 10;
      if (budget !== null && p.budget !== null) {
        const pb = Number(p.budget);
        const diff = Math.abs(pb - budget) / Math.max(budget, 1);
        budgetScore = diff <= 0.25 ? 25 : diff <= 0.5 ? 15 : 5;
      }
      const score = style + room + budgetScore;
      if (score < 15) continue;

      const existing = byDesigner.get(p.designerId);
      const entry = {
        id: p.id,
        title: p.title,
        style: p.style,
        roomType: p.roomType,
      };
      if (!existing || score > existing.score) {
        byDesigner.set(p.designerId, {
          designer: p.designer,
          score,
          breakdown: { style, room, budget: budgetScore },
          matchedPortfolios: existing
            ? [...existing.matchedPortfolios, entry]
            : [entry],
        });
      } else {
        existing.matchedPortfolios.push(entry);
      }
    }

    const items = [...byDesigner.values()].sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: {
        briefId,
        items: items.map((i) => ({
          designer: i.designer,
          score: i.score,
          breakdown: i.breakdown,
          matchedPortfolios: i.matchedPortfolios.slice(0, 5),
        })),
      },
    };
  }

  private parseBudgetMid(range: string | null): number | null {
    if (!range) return null;
    const nums = range.match(/\d+/g)?.map(Number);
    if (!nums?.length) return null;
    if (nums.length === 1) return nums[0];
    return (nums[0] + nums[1]) / 2;
  }
}
