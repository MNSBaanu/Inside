import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.service';
import { Role } from '@inside/database';

describe('MatchingService', () => {
  const prisma = {
    brief: { findUnique: jest.fn() },
    portfolio: { findMany: jest.fn() },
  };
  const user = { id: 'c1', role: Role.CLIENT, activeRole: Role.CLIENT } as AuthUser;
  let service: MatchingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MatchingService(prisma as unknown as PrismaService);
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
    expect(result.data.items[0].breakdown.style).toBe(40);
  });
});
