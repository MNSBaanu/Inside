import { Module } from '@nestjs/common';
import { ActivityModule } from '../../platform/activity/activity.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { WorkLogController } from './work-log.controller';
import { WorkLogService } from './work-log.service';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [WorkLogController],
  providers: [WorkLogService],
})
export class WorkLogModule {}
