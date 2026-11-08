import { Module } from '@nestjs/common';
import { ActivityModule } from '../../platform/activity/activity.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [VerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService],
})
export class VerificationsModule {}
