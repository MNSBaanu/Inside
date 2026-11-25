import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, NotificationType, Role } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { EmailService } from '../../platform/email/email.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';

const INVITE_DAYS = 7;

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AdminInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  private async requireOwner(admin: AuthUser) {
    const actor = await this.prisma.user.findUnique({
      where: { id: admin.id },
      select: { isOwner: true },
    });
    if (!actor?.isOwner) {
      throw new ForbiddenException('Only the platform owner can do this');
    }
  }

  private webUrl() {
    const explicit = this.config.get<string>('WEB_URL');
    const origin = this.config.get<string>('CORS_ORIGIN')?.split(',')[0];
    return (explicit ?? origin ?? 'http://localhost:3000')
      .trim()
      .replace(/\/$/, '');
  }

  async create(admin: AuthUser, rawEmail: string) {
    await this.requireOwner(admin);
    const email = rawEmail.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing?.role === Role.ADMIN) {
      throw new ConflictException('That person is already an admin');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.$transaction(async (tx) => {
      await tx.adminInvite.updateMany({
        where: { email, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return tx.adminInvite.create({
        data: {
          email,
          tokenHash: hashToken(token),
          expiresAt,
          invitedById: admin.id,
        },
        select: { id: true, email: true, expiresAt: true, createdAt: true },
      });
    });

    const link = `${this.webUrl()}/admin-invite?token=${token}`;
    const emailSent = await this.email.send(
      email,
      'You are invited to be an Inside admin',
      inviteEmailHtml(link, INVITE_DAYS),
    );

    await this.activity.log({
      userId: admin.id,
      action: 'ADMIN_INVITED',
      metadata: { email },
    });

    return { success: true, data: { invite, emailSent } };
  }

  async list(admin: AuthUser) {
    await this.requireOwner(admin);
    const items = await this.prisma.adminInvite.findMany({
      where: {
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, expiresAt: true, createdAt: true },
    });
    return { success: true, data: { items } };
  }

  async revoke(admin: AuthUser, id: string) {
    await this.requireOwner(admin);
    const invite = await this.prisma.adminInvite.findUnique({ where: { id } });
    if (!invite || invite.acceptedAt || invite.revokedAt) {
      throw new NotFoundException('Invite not found');
    }
    await this.prisma.adminInvite.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    await this.activity.log({
      userId: admin.id,
      action: 'ADMIN_INVITE_REVOKED',
      metadata: { email: invite.email },
    });
    return { success: true, data: { id } };
  }

  async accept(user: AuthUser, token: string) {
    const invite = await this.prisma.adminInvite.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (
      !invite ||
      invite.acceptedAt ||
      invite.revokedAt ||
      invite.expiresAt <= new Date()
    ) {
      throw new BadRequestException('This invite is invalid or has expired');
    }

    const account = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!account || account.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('This account cannot accept the invite');
    }
    if (account.email.toLowerCase() !== invite.email) {
      throw new ForbiddenException(
        'Sign in with the email address this invite was sent to',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: account.id },
        data: {
          role: Role.ADMIN,
          activeRole: Role.ADMIN,
          hasClientAccount: false,
        },
      });
      await tx.session.updateMany({
        where: { userId: account.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.adminInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });

    await this.notifications.notify({
      userId: account.id,
      type: NotificationType.SYSTEM,
      title: 'You are now an admin',
      message: 'You accepted the invite and now have admin access.',
    });
    await this.activity.log({
      userId: invite.invitedById,
      action: 'ADMIN_GRANTED',
      metadata: { targetUserId: account.id, viaInvite: true },
    });

    return { success: true, data: { role: Role.ADMIN } };
  }
}

function inviteEmailHtml(link: string, days: number) {
  return `<!doctype html><html><body style="margin:0;background:#FCF9F4;font-family:Arial,Helvetica,sans-serif;color:#1B2422">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#064530;padding:24px 32px;color:#FCF9F4;font-size:22px;font-weight:bold">Inside</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px">You have been invited to be an admin</h1>
<p style="margin:0 0 24px;line-height:1.6;color:#6C7471">The Inside platform owner invited you to help run the platform. Sign in or create an account with this email address, then accept the invite.</p>
<a href="${link}" style="display:inline-block;background:#064530;color:#FCF9F4;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold">Accept invite</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6C7471">This link works once and expires in ${days} days. If you were not expecting it, ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
}
