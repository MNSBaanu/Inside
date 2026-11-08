import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        success: true,
        data: { status: 'ok' as const, database: 'up' as const },
      };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
