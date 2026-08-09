import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@inside/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.getOrThrow<string>('DATABASE_URL'),
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      const rows = await this.$queryRaw<Array<{ db: string }>>`
        SELECT current_database() AS db
      `;
      this.logger.log(`Prisma connected (${rows[0]?.db ?? 'unknown'})`);
    } catch (error) {
      this.logger.warn(
        `Prisma not connected yet (configure DATABASE_URL / Step 8): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
