import { Module } from '@nestjs/common';
import { ActivityModule } from '../../platform/activity/activity.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
