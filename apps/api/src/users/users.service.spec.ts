import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AccountStatus, Role } from '@inside/database';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown) =>
      Promise.all(ops as Promise<unknown>[]),
    ),
  };

  const authService = {
    toPublicUser: jest.fn((user: { id: string }) => user),
    signAccessToken: jest.fn().mockResolvedValue('new.access.token'),
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      prisma as unknown as PrismaService,
      authService as unknown as AuthService,
    );
  });

  it('allows designers to switch to CLIENT', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
      activeRole: Role.DESIGNER,
      status: AccountStatus.ACTIVE,
      passwordHash: 'x',
    });
    prisma.user.update.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
      activeRole: Role.CLIENT,
      status: AccountStatus.ACTIVE,
    });

    const result = await service.switchActiveRole('d1', 's1', {
      activeRole: 'CLIENT',
    });

    expect(result.data.accessToken).toBe('new.access.token');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { activeRole: Role.CLIENT },
      }),
    );
  });

  it('blocks clients from switching to DESIGNER', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'c1',
      role: Role.CLIENT,
      activeRole: Role.CLIENT,
      status: AccountStatus.ACTIVE,
      passwordHash: 'x',
    });

    await expect(
      service.switchActiveRole('c1', 's1', { activeRole: 'DESIGNER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects wrong current password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'c1',
      status: AccountStatus.ACTIVE,
      passwordHash: await bcrypt.hash('Password123!', 10),
    });

    await expect(
      service.changePassword('c1', {
        currentPassword: 'WrongPass1!',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
