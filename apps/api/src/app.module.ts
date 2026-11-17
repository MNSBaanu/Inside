import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './modules/trust/admin/admin.module';
import { AuthModule } from './modules/identity/auth/auth.module';
import { BlocksModule } from './modules/trust/blocks/blocks.module';
import { BriefsModule } from './modules/discovery/briefs/briefs.module';
import { DeliverablesModule } from './modules/delivery/deliverables/deliverables.module';
import { FavouritesModule } from './modules/discovery/favourites/favourites.module';
import { HealthModule } from './modules/platform/health/health.module';
import { MatchingModule } from './modules/discovery/matching/matching.module';
import { MessagesModule } from './modules/delivery/messages/messages.module';
import { MoodboardsModule } from './modules/discovery/moodboards/moodboards.module';
import { ContactModule } from './modules/platform/contact/contact.module';
import { NewsletterModule } from './modules/platform/newsletter/newsletter.module';
import { NotificationsModule } from './modules/platform/notifications/notifications.module';
import { PaymentsModule } from './modules/delivery/payments/payments.module';
import { PortfoliosModule } from './modules/discovery/portfolios/portfolios.module';
import { ProductsModule } from './modules/discovery/products/products.module';
import { DesignersModule } from './modules/discovery/designers/designers.module';
import { PrismaModule } from './database/prisma.module';
import { ProjectsModule } from './modules/delivery/projects/projects.module';
import { ProposalsModule } from './modules/hiring/proposals/proposals.module';
import { ReportsModule } from './modules/trust/reports/reports.module';
import { RequestsModule } from './modules/hiring/requests/requests.module';
import { ReviewsModule } from './modules/delivery/reviews/reviews.module';
import { StagesModule } from './modules/delivery/stages/stages.module';
import { TasksModule } from './modules/delivery/tasks/tasks.module';
import { UploadsModule } from './modules/platform/uploads/uploads.module';
import { UsersModule } from './modules/identity/users/users.module';
import { VerificationsModule } from './modules/identity/verifications/verifications.module';

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
    ProductsModule,
    MoodboardsModule,
    BriefsModule,
    MatchingModule,
    RequestsModule,
    ProposalsModule,
    NotificationsModule,
    ProjectsModule,
    StagesModule,
    TasksModule,
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
    ContactModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
