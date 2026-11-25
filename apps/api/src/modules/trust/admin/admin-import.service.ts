import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@inside/database';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { EmailService } from '../../platform/email/email.service';
import { webUrl, welcomeEmailHtml } from './admin-emails';
import { AdminManageService } from './admin-manage.service';
import {
  ImportSubscriberRowDto,
  ImportUserRowDto,
} from './dto/admin-import.dto';
import { AdminCreateProductDto } from './dto/admin-manage.dto';

type Row = Record<string, unknown>;
type RowError = { row: number; message: string };
type ImportResult = {
  created: number;
  skipped: number;
  failed: number;
  errors: RowError[];
};

const text = (value: unknown) =>
  typeof value === 'string'
    ? value.trim()
    : typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : '';

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  role: 'Role',
  description: 'Description',
  category: 'Category',
  style: 'Style',
  price: 'Price',
  sellerName: 'Seller name',
  sellerUrl: 'Seller URL',
  isPublished: 'Published',
};

const truthy = (value: unknown) =>
  !['no', 'n', 'false', '0', 'hidden', 'unpublished'].includes(
    text(value).toLowerCase(),
  );

@Injectable()
export class AdminImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly activity: ActivityService,
    private readonly manage: AdminManageService,
  ) {}

  private async firstError<T extends object>(
    type: new () => T,
    row: Row,
  ): Promise<{ value?: T; message?: string }> {
    const value = plainToInstance(type, row);
    const problems = await validate(value, { whitelist: true });
    if (problems.length === 0) return { value };
    const first = problems[0];
    if (first.property === 'imageUrl') {
      return {
        message: text(row.imageUrl)
          ? 'Image URL must be an image already uploaded to Cloudinary.'
          : 'Image URL is missing.',
      };
    }
    const label = COLUMN_LABELS[first.property] ?? first.property;
    const problem = Object.values(first.constraints ?? {})[0];
    return {
      message: problem
        ? `${problem.replace(first.property, label)}.`
        : `${label} is not valid.`,
    };
  }

  private async log(admin: AuthUser, action: string, result: ImportResult) {
    await this.activity.log({
      userId: admin.id,
      action,
      metadata: {
        created: result.created,
        skipped: result.skipped,
        failed: result.failed,
      },
    });
  }

  async importUsers(admin: AuthUser, rows: Row[]) {
    const result: ImportResult = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };
    const seen = new Set<string>();

    for (const [index, raw] of rows.entries()) {
      const line = index + 2;
      const { value, message } = await this.firstError(ImportUserRowDto, {
        name: text(raw.name),
        email: text(raw.email).toLowerCase(),
        role: text(raw.role).toUpperCase(),
      });
      if (!value) {
        result.failed++;
        result.errors.push({ row: line, message: message ?? 'Invalid row' });
        continue;
      }
      const email = value.email.toLowerCase();
      if (
        seen.has(email) ||
        (await this.prisma.user.findUnique({ where: { email } }))
      ) {
        seen.add(email);
        result.skipped++;
        continue;
      }
      seen.add(email);

      const role = value.role === 'DESIGNER' ? Role.DESIGNER : Role.CLIENT;
      await this.prisma.user.create({
        data: { email, name: value.name.trim(), role, activeRole: role },
      });
      result.created++;
      await this.email.send(
        email,
        'Your Inside account is ready',
        welcomeEmailHtml(value.name.trim(), `${webUrl(this.config)}/register`),
      );
    }

    await this.log(admin, 'USERS_IMPORTED', result);
    return { success: true, data: result };
  }

  async importProducts(admin: AuthUser, rows: Row[]) {
    const result: ImportResult = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const [index, raw] of rows.entries()) {
      const line = index + 2;
      if (!/^\d+(\.\d{1,2})?$/.test(text(raw.price).replace(/,/g, ''))) {
        result.failed++;
        result.errors.push({
          row: line,
          message: 'Price must be a number in LKR, for example 185000.',
        });
        continue;
      }
      const { value, message } = await this.firstError(AdminCreateProductDto, {
        name: text(raw.name),
        description: text(raw.description),
        category: text(raw.category),
        style: text(raw.style) || undefined,
        price: text(raw.price).replace(/,/g, ''),
        imageUrl: text(raw.imageUrl),
        sellerName: text(raw.sellerName),
        sellerUrl: text(raw.sellerUrl),
        isPublished: truthy(raw.isPublished ?? 'yes'),
      });
      if (!value) {
        result.failed++;
        result.errors.push({ row: line, message: message ?? 'Invalid row' });
        continue;
      }
      await this.manage.createProduct(admin, value);
      result.created++;
    }

    await this.log(admin, 'PRODUCTS_IMPORTED', result);
    return { success: true, data: result };
  }

  async importSubscribers(admin: AuthUser, rows: Row[]) {
    const result: ImportResult = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };
    const valid = new Map<string, true>();

    for (const [index, raw] of rows.entries()) {
      const { value, message } = await this.firstError(ImportSubscriberRowDto, {
        email: text(raw.email).toLowerCase(),
      });
      if (!value) {
        result.failed++;
        result.errors.push({
          row: index + 2,
          message: message ?? 'Invalid row',
        });
        continue;
      }
      valid.set(value.email.toLowerCase(), true);
    }

    const emails = [...valid.keys()];
    const inserted = await this.prisma.newsletterSubscriber.createMany({
      data: emails.map((email) => ({ email })),
      skipDuplicates: true,
    });
    result.created = inserted.count;
    result.skipped = emails.length - inserted.count;

    await this.log(admin, 'SUBSCRIBERS_IMPORTED', result);
    return { success: true, data: result };
  }
}
