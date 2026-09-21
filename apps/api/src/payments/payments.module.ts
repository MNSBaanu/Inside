import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { stripeProvider } from './stripe.provider';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, stripeProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
