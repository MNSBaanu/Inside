import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, Role } from '@inside/database';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../database/prisma.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
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
      email: 'new@insidesign.me',
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
    prisma.session.create.mockResolvedValue({ id: 's1' });

    const result = await service.register({
      email: 'new@insidesign.me',
      password: 'Password123!',
      name: 'New User',
    });

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('access.jwt');
    expect(result.data.refreshToken).toHaveLength(64);
  });

  it('rejects duplicate email on register', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({
        email: 'dup@insidesign.me',
        password: 'Password123!',
        name: 'Dup',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'client@insidesign.me',
      passwordHash: await bcrypt.hash('Password123!', 10),
      status: AccountStatus.ACTIVE,
    });

    await expect(
      service.login({ email: 'client@insidesign.me', password: 'WrongPass1!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh for a suspended account without creating a session', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'u1', status: AccountStatus.SUSPENDED },
    });

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.session.updateMany).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
