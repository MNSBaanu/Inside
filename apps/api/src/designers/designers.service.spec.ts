import { AccountStatus, Role } from '@inside/database';
import { PrismaService } from '../prisma/prisma.service';
import { DesignersService } from './designers.service';

describe('Designer directory eligibility', () => {
  const prisma = {
    user: { count: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([0, []]);
  });

  it('requires published work or verification, including when searching and filtering', async () => {
    const service = new DesignersService(prisma as unknown as PrismaService);
    await service.list({
      q: 'QA',
      style: 'Coastal',
      availableOnly: 'true',
      verifiedOnly: 'true',
    });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where).toEqual(
      expect.objectContaining({
        role: Role.DESIGNER,
        status: AccountStatus.ACTIVE,
        isAvailable: true,
        isVerified: true,
        AND: [
          {
            OR: [
              { isVerified: true },
              { portfolios: { some: { isPublished: true } } },
            ],
          },
        ],
        OR: [
          { name: { contains: 'QA', mode: 'insensitive' } },
          { bio: { contains: 'QA', mode: 'insensitive' } },
        ],
        portfolios: {
          some: {
            isPublished: true,
            style: { equals: 'Coastal', mode: 'insensitive' },
          },
        },
      }),
    );
    expect(prisma.user.count).toHaveBeenCalledWith({ where });
  });

  it('does not restrict availability or verification unless requested', async () => {
    const service = new DesignersService(prisma as unknown as PrismaService);
    await service.list({ availableOnly: 'false', verifiedOnly: 'false' });
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.isAvailable).toBeUndefined();
    expect(where.isVerified).toBeUndefined();
    expect(where.AND).toHaveLength(1);
  });
});
