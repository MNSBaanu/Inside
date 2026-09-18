import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, AuthTokenType, Role } from '@inside/database';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    authToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown) =>
      Promise.all(ops as Promise<unknown>[]),
    ),
  };

  const jwt = {
    signAsync: jest.fn().mockResolvedValue('access.jwt'),
  };

  const config = {
    get: jest.fn((key: string): string | undefined => {
      if (key === 'JWT_REFRESH_DAYS') return '30';
      if (key === 'NODE_ENV') return 'test';
      if (key === 'EXPOSE_DEV_AUTH_TOKENS') return 'true';
      return undefined;
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('registers a new client and returns tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'new@inside.test',
      name: 'New User',
      role: Role.CLIENT,
      activeRole: Role.CLIENT,
      isVerified: false,
      emailVerified: null,
      status: AccountStatus.ACTIVE,
      avatarUrl: null,
      createdAt: new Date(),
      passwordHash: 'hash',
    });
    prisma.authToken.create.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({});

    const result = await service.register({
      email: 'new@inside.test',
      password: 'Password123!',
      name: 'New User',
    });

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('access.jwt');
    expect(result.data.refreshToken).toHaveLength(64);
    expect(result.data.emailVerificationToken).toHaveLength(64);
    expect(prisma.authToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: AuthTokenType.EMAIL_VERIFY }),
      }),
    );
  });

  it('rejects duplicate email on register', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({
        email: 'dup@inside.test',
        password: 'Password123!',
        name: 'Dup',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'client@inside.test',
      passwordHash: await bcrypt.hash('Password123!', 10),
      status: AccountStatus.ACTIVE,
    });

    await expect(
      service.login({ email: 'client@inside.test', password: 'WrongPass1!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('omits emailVerificationToken in production', async () => {
    config.get.mockImplementation((key: string): string | undefined => {
      if (key === 'JWT_REFRESH_DAYS') return '30';
      if (key === 'NODE_ENV') return 'production';
      if (key === 'EXPOSE_DEV_AUTH_TOKENS') return 'true';
      return undefined;
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'prod@inside.test',
      name: 'Prod',
      role: Role.CLIENT,
      activeRole: Role.CLIENT,
      isVerified: false,
      emailVerified: null,
      status: AccountStatus.ACTIVE,
      avatarUrl: null,
      createdAt: new Date(),
      passwordHash: 'hash',
    });
    prisma.authToken.create.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({});

    const result = await service.register({
      email: 'prod@inside.test',
      password: 'Password123!',
      name: 'Prod',
    });

    expect(result.data.emailVerificationToken).toBeUndefined();
  });
});
