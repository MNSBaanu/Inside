import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountStatus, Role } from '@inside/database';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SwitchActiveRoleDto } from './dto/switch-active-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly bcryptRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getMe(userId: string) {
    const user = await this.requireActiveUser(userId);
    return {
      success: true,
      data: { user: this.authService.toPublicUser(user) },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.isAvailable !== undefined
          ? { isAvailable: dto.isAvailable }
          : {}),
        ...(dto.availableFrom !== undefined
          ? {
              availableFrom: dto.availableFrom
                ? new Date(dto.availableFrom)
                : null,
            }
          : {}),
      },
    });

    return {
      success: true,
      data: { user: this.authService.toPublicUser(user) },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.requireActiveUser(userId);
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.bcryptRounds);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      data: { passwordChanged: true },
    };
  }

  async switchActiveRole(
    userId: string,
    sessionId: string,
    dto: SwitchActiveRoleDto,
  ) {
    const user = await this.requireActiveUser(userId);
    const nextRole =
      dto.activeRole === 'DESIGNER' ? Role.DESIGNER : Role.CLIENT;

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Admins cannot switch active role');
    }

    // Clients become designers through createDesignerAccount, not a switch.
    if (user.role === Role.CLIENT && nextRole === Role.DESIGNER) {
      throw new ForbiddenException(
        'Client accounts cannot switch to designer mode',
      );
    }

    if (
      user.role === Role.DESIGNER &&
      nextRole === Role.CLIENT &&
      !user.hasClientAccount
    ) {
      throw new ForbiddenException('Create a client account first');
    }

    if (user.role !== Role.DESIGNER && user.role !== Role.CLIENT) {
      throw new ForbiddenException(
        'Role switch is not allowed for this account',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activeRole: nextRole },
    });

    const accessToken = await this.authService.signAccessToken(
      updated,
      sessionId,
    );

    return {
      success: true,
      data: {
        user: this.authService.toPublicUser(updated),
        accessToken,
      },
    };
  }

  async createClientAccount(userId: string) {
    const user = await this.requireActiveUser(userId);
    if (user.role !== Role.DESIGNER) {
      throw new ForbiddenException('Only designers can add a client account');
    }
    if (user.hasClientAccount) {
      throw new BadRequestException('You already have a client account');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { hasClientAccount: true },
    });

    return {
      success: true,
      data: { user: this.authService.toPublicUser(updated) },
    };
  }

  async createDesignerAccount(userId: string, sessionId: string) {
    const user = await this.requireActiveUser(userId);
    if (user.role !== Role.CLIENT) {
      throw new ForbiddenException('Only clients can add a designer account');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.DESIGNER,
        activeRole: Role.DESIGNER,
        hasClientAccount: true,
      },
    });

    const accessToken = await this.authService.signAccessToken(
      updated,
      sessionId,
    );

    return {
      success: true,
      data: {
        user: this.authService.toPublicUser(updated),
        accessToken,
      },
    };
  }

  private async requireActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
