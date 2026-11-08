import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotent, and the same response either way so it can't reveal subscribers. */
  async subscribe(email: string) {
    const normalized = email.trim().toLowerCase();
    await this.prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });
    return { success: true, data: { subscribed: true } };
  }
}
