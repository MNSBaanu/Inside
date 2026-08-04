import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BriefsModule } from './briefs/briefs.module';
import { FavouritesModule } from './favourites/favourites.module';
import { HealthModule } from './health/health.module';
import { MatchingModule } from './matching/matching.module';
import { MoodboardsModule } from './moodboards/moodboards.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProposalsModule } from './proposals/proposals.module';
import { RequestsModule } from './requests/requests.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PortfoliosModule,
    FavouritesModule,
    MoodboardsModule,
    BriefsModule,
    MatchingModule,
    RequestsModule,
    ProposalsModule,
    HealthModule,
  ],
})
export class AppModule {}
