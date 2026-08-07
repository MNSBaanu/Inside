import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuthTokenType,
  Role,
  AccountStatus,
  type User,
} from '@inside/database';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export type AuthUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'role'
  | 'activeRole'
  | 'isVerified'
  | 'status'
  | 'bio'
  | 'avatarUrl'
  | 'phone'
  | 'location'
  | 'isAvailable'
  | 'createdAt'
>;

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  activeRole: Role;
};

@Injectable()
export class AuthService {
  private readonly bcryptRounds = 10;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const days = Number(this.config.get('JWT_REFRESH_DAYS') ?? 30);
    this.refreshTtlMs = days * 24 * 60 * 60 * 1000;
  }

  async register(dto: RegisterDto) {
    const role = dto.role === 'DESIGNER' ? Role.DESIGNER : Role.CLIENT;

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role,
        activeRole: role,
        isVerified: false,
      },
    });

    const rawVerifyToken = this.createRawToken();
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawVerifyToken),
        type: AuthTokenType.EMAIL_VERIFY,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await this.issueTokens(user);
    return {
      success: true,
      data: {
        user: this.toPublicUser(user),
        ...tokens,
        ...(this.exposeDevAuthSecrets()
          ? { emailVerificationToken: rawVerifyToken }
          : {}),
      },
    };
  }

  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }

    const tokens = await this.issueTokens(user, meta);
    return {
      success: true,
      data: {
        user: this.toPublicUser(user),
        ...tokens,
      },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(session.user, {
      userAgent: session.userAgent ?? undefined,
      ipAddress: session.ipAddress ?? undefined,
    });

    return {
      success: true,
      data: {
        user: this.toPublicUser(session.user),
        ...tokens,
      },
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
    });
    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true, data: { loggedOut: true } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { success: true, data: { user: this.toPublicUser(user) } };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always same response to avoid account enumeration
    const response = {
      success: true,
      data: {
        message: 'If that email exists, a reset token was created',
      } as { message: string; resetToken?: string },
    };

    if (!user) {
      return response;
    }

    const rawToken = this.createRawToken();
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        type: AuthTokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    if (this.exposeDevAuthSecrets()) {
      response.data.resetToken = rawToken;
    }
    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    const authToken = await this.findValidAuthToken(
      token,
      AuthTokenType.PASSWORD_RESET,
    );

    const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: authToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true, data: { reset: true } };
  }

  async verifyEmail(token: string) {
    const authToken = await this.findValidAuthToken(
      token,
      AuthTokenType.EMAIL_VERIFY,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { isVerified: true },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, data: { verified: true } };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  private async findValidAuthToken(rawToken: string, type: AuthTokenType) {
    const tokenHash = this.hashToken(rawToken);
    const authToken = await this.prisma.authToken.findUnique({
      where: { tokenHash },
    });
    if (
      !authToken ||
      authToken.type !== type ||
      authToken.usedAt ||
      authToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }
    return authToken;
  }

  async signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      activeRole: user.activeRole,
    };
    return this.jwt.signAsync(payload);
  }

  toPublicUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole,
      isVerified: user.isVerified,
      status: user.status,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      location: user.location,
      isAvailable: user.isAvailable,
      createdAt: user.createdAt,
    };
  }

  private async issueTokens(
    user: User,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const accessToken = await this.signAccessToken(user);

    const refreshToken = this.createRawToken();
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    return { accessToken, refreshToken };
  }

  private createRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Raw verify/reset tokens in API responses — never in production. */
  private exposeDevAuthSecrets(): boolean {
    return this.config.get<string>('NODE_ENV') !== 'production';
  }
}
