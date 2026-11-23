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
import { createClerkClient, verifyToken } from '@clerk/backend';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client, type TokenInfo } from 'google-auth-library';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../platform/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

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
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
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
      throw new UnauthorizedException();
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

    const rawVerifyToken = this.createRawToken();
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawVerifyToken),
        type: AuthTokenType.EMAIL_VERIFY,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.email.send(
      user.email,
      'Confirm your email for Inside',
      `Hi ${user.name},\n\nConfirm your email address to finish setting up your Inside account:\n${this.email.webUrl(`/verify-email?token=${rawVerifyToken}`)}\n\nThe link expires in 24 hours. If you didn't sign up, you can ignore this email.`,
    );

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

  async loginWithGoogle(
    dto: GoogleLoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured');
    }

    let tokenInfo: TokenInfo;
    try {
      tokenInfo = await this.googleClient.getTokenInfo(dto.accessToken);
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (
      tokenInfo.aud !== clientId ||
      !tokenInfo.sub ||
      !tokenInfo.email ||
      !tokenInfo.email_verified
    ) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    type GoogleProfile = { name?: string; picture?: string };
    const profile: GoogleProfile = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${dto.accessToken}` } },
    )
      .then((res) => (res.ok ? (res.json() as Promise<GoogleProfile>) : {}))
      .catch(() => ({}));
    const payload = {
      sub: tokenInfo.sub,
      name: profile.name,
      picture: profile.picture,
    };

    const email = tokenInfo.email.toLowerCase();
    let user =
      (await this.prisma.user.findUnique({
        where: { googleId: payload.sub },
      })) ?? (await this.prisma.user.findUnique({ where: { email } }));

    if (user) {
      if (user.googleId && user.googleId !== payload.sub) {
        throw new UnauthorizedException('Invalid Google credential');
      }
      if (!user.googleId || !user.emailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: payload.sub,
            emailVerified: user.emailVerified ?? new Date(),
          },
        });
      }
    } else {
      const role = dto.role === 'DESIGNER' ? Role.DESIGNER : Role.CLIENT;
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(
            randomBytes(32).toString('hex'),
            this.bcryptRounds,
          ),
          googleId: payload.sub,
          name: payload.name ?? email.split('@')[0],
          avatarUrl: payload.picture,
          role,
          activeRole: role,
          isVerified: false,
          emailVerified: new Date(),
        },
      });
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
    await this.email.send(
      user.email,
      'Reset your Inside password',
      `Hi ${user.name},\n\nUse this link to choose a new password:\n${this.email.webUrl(`/reset-password?token=${rawToken}`)}\n\nThe link expires in 1 hour. If you didn't ask for this, you can ignore this email.`,
    );

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
        data: { emailVerified: new Date() },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, data: { verified: true } };
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
    await this.prisma.authToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: now } },
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

  /** Raw verify/reset tokens in API responses — opt-in, never in production. */
  private exposeDevAuthSecrets(): boolean {
    return (
      this.config.get<string>('EXPOSE_DEV_AUTH_TOKENS') === 'true' &&
      this.config.get<string>('NODE_ENV') !== 'production'
    );
  }
}
