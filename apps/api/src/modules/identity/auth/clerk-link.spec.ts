import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@inside/database';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../database/prisma.service';

const getUser = jest.fn();
jest.mock('@clerk/backend', () => ({
  createClerkClient: () => ({ users: { getUser } }),
  verifyToken: jest.fn(),
}));

describe('AuthService Clerk sign-in linking', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const config = { get: jest.fn(() => 'sk_test') };

  let service: AuthService;
  const link = (clerkId: string) =>
    (
      service as unknown as {
        findOrLinkClerkUser: (id: string) => Promise<{ id: string }>;
      }
    ).findOrLinkClerkUser(clerkId);

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      config as unknown as ConfigService,
    );
    getUser.mockResolvedValue({
      primaryEmailAddress: {
        emailAddress: 'New@Example.com',
        verification: { status: 'verified' },
      },
      unsafeMetadata: {},
      fullName: 'New Person',
      hasImage: false,
    });
  });

  it('returns the account another request created at the same moment', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null) // by clerkId
      .mockResolvedValueOnce(null) // by email
      .mockResolvedValueOnce({ id: 'u1', clerkId: 'clerk_1' }); // after the clash
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(link('clerk_1')).resolves.toEqual(
      expect.objectContaining({ id: 'u1' }),
    );
  });

  it('still fails on other database errors', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue(new Error('db down'));
    await expect(link('clerk_1')).rejects.toThrow('db down');
  });
});
