import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { BriefsModule } from './briefs/briefs.module';
import { DeliverablesModule } from './deliverables/deliverables.module';
import { FavouritesModule } from './favourites/favourites.module';
import { HealthModule } from './health/health.module';
import { MatchingModule } from './matching/matching.module';
import { MessagesModule } from './messages/messages.module';
import { MoodboardsModule } from './moodboards/moodboards.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { DesignersModule } from './designers/designers.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ReportsModule } from './reports/reports.module';
import { RequestsModule } from './requests/requests.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StagesModule } from './stages/stages.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { VerificationsModule } from './verifications/verifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      skipIf: (context) =>
        process.env.THROTTLE_DISABLED === 'true' ||
        context.switchToHttp().getRequest<{ method: string }>().method ===
          'GET',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PortfoliosModule,
    DesignersModule,
    FavouritesModule,
    MoodboardsModule,
    BriefsModule,
    MatchingModule,
    RequestsModule,
    ProposalsModule,
    NotificationsModule,
    ProjectsModule,
    StagesModule,
    DeliverablesModule,
    MessagesModule,
    PaymentsModule,
    ReviewsModule,
    ReportsModule,
    BlocksModule,
    VerificationsModule,
    AdminModule,
    UploadsModule,
    NewsletterModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
