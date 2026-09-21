import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import type { AuthUser } from '../auth/auth.service';
import { Role } from '@inside/database';

describe('MatchingService', () => {
  const prisma = {
    brief: { findUnique: jest.fn() },
    portfolio: { findMany: jest.fn() },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
  };
  const blocks = {
    listBlockedCounterpartIds: jest.fn(),
  };
  const user = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;
  let service: MatchingService;

  beforeEach(() => {
    jest.clearAllMocks();
    blocks.listBlockedCounterpartIds.mockResolvedValue(new Set());
    service = new MatchingService(
      prisma as unknown as PrismaService,
      blocks as unknown as BlocksService,
    );
  });

  it('scores style and room matches', async () => {
    prisma.brief.findUnique.mockResolvedValue({
      id: 'b1',
      clientId: 'c1',
      styles: ['Scandinavian'],
      rooms: ['Living Room'],
      budgetRange: '400000-500000',
    });
    prisma.portfolio.findMany.mockResolvedValue([
      {
        id: 'p1',
        designerId: 'd1',
        title: 'Living',
        style: 'Scandinavian',
        roomType: 'Living Room',
        budget: 450000,
        designer: {
          id: 'd1',
          name: 'Ravi',
          avatarUrl: null,
          location: null,
          isVerified: true,
          isAvailable: true,
          bio: null,
        },
      },
    ]);

    const result = await service.matchDesigners(user, 'b1');
    expect(result.data.items[0].score).toBe(100);
    expect(result.data.items[0].breakdown.style).toBe(35);
    expect(result.data.items[0].breakdown.description).toBeNull();
    expect(result.data.items[0].factors.map((f) => f.key)).toEqual([
      'style',
      'room',
      'budget',
    ]);
  });

  describe('relevance and consistency (FR-AI-6)', () => {
    const portfolio = (
      designerId: string,
      description: string,
      designer: Partial<{ name: string; location: string | null }> = {},
    ) => ({
      id: `p-${designerId}`,
      designerId,
      title: 'Living room',
      description,
      style: 'Scandinavian',
      roomType: 'Living Room',
      budget: 450000,
      designer: {
        id: designerId,
        name: designer.name ?? designerId,
        avatarUrl: null,
        location: designer.location ?? null,
        isVerified: false,
        isAvailable: true,
        bio: null,
      },
    });

    const briefWithDescription = {
      id: 'b1',
      clientId: 'c1',
      styles: ['Scandinavian'],
      rooms: ['Living Room'],
      budgetRange: '400000-500000',
      description:
        'Light oak shelving, layered lighting and a neutral palette.',
    };

    it('ranks the portfolio closer to the brief description higher', async () => {
      prisma.brief.findUnique.mockResolvedValue(briefWithDescription);
      prisma.portfolio.findMany.mockResolvedValue([
        portfolio('far', 'Dark teak joinery with brass fittings.'),
        portfolio('close', 'Light oak shelving with layered lighting.'),
      ]);

      const result = await service.matchDesigners(user, 'b1');
      expect(result.data.items.map((i) => i.designer.id)).toEqual([
        'close',
        'far',
      ]);
      const [close, far] = result.data.items;
      expect(close.breakdown.description).toBeGreaterThan(
        far.breakdown.description ?? 0,
      );
    });

    it('gives the same ranking and scores for the same input', async () => {
      prisma.brief.findUnique.mockResolvedValue(briefWithDescription);
      prisma.portfolio.findMany.mockResolvedValue([
        portfolio('a', 'Oak shelving and soft lighting.'),
        portfolio('b', 'Concrete floors and steel frames.'),
        portfolio('c', 'Neutral palette with layered lighting.'),
      ]);

      const first = await service.matchDesigners(user, 'b1');
      const second = await service.matchDesigners(user, 'b1');
      expect(second.data.items).toEqual(first.data.items);
    });

    it('ignores irrelevant attributes such as name and location', async () => {
      prisma.brief.findUnique.mockResolvedValue(briefWithDescription);
      const text = 'Light oak shelving with layered lighting.';
      prisma.portfolio.findMany.mockResolvedValue([
        portfolio('d1', text, { name: 'Anjali Perera', location: 'Colombo' }),
        portfolio('d2', text, { name: 'Mohamed Rizwan', location: 'Jaffna' }),
      ]);

      const result = await service.matchDesigners(user, 'b1');
      const [first, second] = result.data.items;
      expect(first.score).toBe(second.score);
      expect(first.breakdown).toEqual(second.breakdown);
    });
  });

  it('excludes blocked designers from the query', async () => {
    prisma.brief.findUnique.mockResolvedValue({
      id: 'b1',
      clientId: 'c1',
      styles: ['Scandinavian'],
      rooms: ['Living Room'],
      budgetRange: null,
    });
    blocks.listBlockedCounterpartIds.mockResolvedValue(new Set(['d9']));
    prisma.portfolio.findMany.mockResolvedValue([]);

    await service.matchDesigners(user, 'b1');

    expect(prisma.portfolio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          designerId: { notIn: ['c1', 'd9'] },
        }),
      }),
    );
  });
});
