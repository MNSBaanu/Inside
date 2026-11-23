import { createHash, randomBytes } from 'crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, AccountStatus, type User } from '@inside/database';
import { createClerkClient, verifyToken } from '@clerk/backend';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export type AuthUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'role'
  | 'activeRole'
  | 'hasClientAccount'
  | 'isVerified'
  | 'isOwner'
  | 'status'
  | 'bio'
  | 'avatarUrl'
  | 'phone'
  | 'location'
  | 'isAvailable'
  | 'availableFrom'
  | 'createdAt'
> & { emailVerified: boolean };

/** The authenticated user plus the refresh session its access token belongs to (none for Clerk sign-ins). */
export type RequestUser = AuthUser & { sessionId?: string };

export type JwtPayload = {
  sub: string;
  sid: string;
  email: string;
  role: Role;
  activeRole: Role;
};

@Injectable()
export class AuthService {
  private readonly bcryptRounds = 10;
  /** Compared against when the email is unknown, so timing doesn't reveal accounts. */
  private readonly dummyHash = bcrypt.hashSync(
    randomBytes(16).toString('hex'),
    this.bcryptRounds,
  );
  private readonly refreshTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const days = Number(this.config.get('JWT_REFRESH_DAYS') ?? 30);
    this.refreshTtlMs = days * 24 * 60 * 60 * 1000;
    this.clerkSecretKey = this.config.get<string>('CLERK_SECRET_KEY');
  }

  private readonly clerkSecretKey: string | undefined;

  /** Accepts a Clerk session token, or a legacy Inside access token until those are retired. */
  async authenticateToken(token: string): Promise<RequestUser> {
    const clerkUserId = await this.verifyClerkToken(token);
    if (!clerkUserId) {
      const payload = await this.jwt
        .verifyAsync<JwtPayload>(token)
        .catch(() => null);
      if (!payload) throw new UnauthorizedException();
      return this.validateJwtPayload(payload);
    }
    const user = await this.findOrLinkClerkUser(clerkUserId);
    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }
    return this.toPublicUser(user);
  }

  private async verifyClerkToken(token: string): Promise<string | null> {
    if (!this.clerkSecretKey) return null;
    try {
      const payload = await verifyToken(token, {
        secretKey: this.clerkSecretKey,
      });
      return payload.sub;
    } catch {
      return null;
    }
  }

  private async findOrLinkClerkUser(clerkId: string): Promise<User> {
    const linked = await this.prisma.user.findUnique({ where: { clerkId } });
    if (linked) return linked;

    const clerkUser = await createClerkClient({
      secretKey: this.clerkSecretKey,
    }).users.getUser(clerkId);
    const email = clerkUser.primaryEmailAddress?.emailAddress.toLowerCase();
    if (!email) throw new UnauthorizedException();
    const emailVerified =
      clerkUser.primaryEmailAddress?.verification?.status === 'verified'
        ? new Date()
        : null;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          clerkId,
          emailVerified: existing.emailVerified ?? emailVerified,
        },
      });
    }

    const role =
      clerkUser.unsafeMetadata.role === 'DESIGNER'
        ? Role.DESIGNER
        : Role.CLIENT;
    return this.prisma.user.create({
      data: {
        email,
        clerkId,
        name:
          clerkUser.fullName?.trim() ||
          clerkUser.username ||
          email.split('@')[0],
        avatarUrl: clerkUser.hasImage ? clerkUser.imageUrl : null,
        role,
        activeRole: role,
        isVerified: false,
        emailVerified,
      },
    });
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

    const tokens = await this.issueTokens(user);
    return {
      success: true,
      data: {
        user: this.toPublicUser(user),
        ...tokens,
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
    if (!user?.passwordHash) {
      await bcrypt.compare(dto.password, this.dummyHash);
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

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status === AccountStatus.SUSPENDED
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const revoked = await this.prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

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

  /** Access tokens stop working as soon as their session is revoked. */
  async validateJwtPayload(payload: JwtPayload): Promise<RequestUser> {
    if (!payload.sid) {
      throw new UnauthorizedException();
    }
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.status === AccountStatus.SUSPENDED
    ) {
      throw new UnauthorizedException();
    }
    return { ...this.toPublicUser(session.user), sessionId: session.id };
  }

  async signAccessToken(user: User, sessionId: string): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      sid: sessionId,
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
      hasClientAccount: user.hasClientAccount,
      isVerified: user.isVerified,
      isOwner: user.isOwner,
      emailVerified: user.emailVerified !== null,
      status: user.status,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      location: user.location,
      isAvailable: user.isAvailable,
      availableFrom: user.availableFrom,
      createdAt: user.createdAt,
    };
  }

  private async issueTokens(
    user: User,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const now = new Date();
    await this.prisma.session.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { expiresAt: { lt: now } },
          { revokedAt: { lt: new Date(now.getTime() - this.refreshTtlMs) } },
        ],
      },
    });

    const refreshToken = this.createRawToken();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });
    const accessToken = await this.signAccessToken(user, session.id);

    return { accessToken, refreshToken };
  }

  private createRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
