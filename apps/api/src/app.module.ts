import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BriefsModule } from './briefs/briefs.module';
import { HealthModule } from './health/health.module';
import { MoodboardsModule } from './moodboards/moodboards.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PortfoliosModule,
    MoodboardsModule,
    BriefsModule,
    HealthModule,
  ],
})
export class AppModule {}
