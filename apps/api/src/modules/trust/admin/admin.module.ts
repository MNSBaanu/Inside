import { Module } from '@nestjs/common';
import { ActivityModule } from '../../platform/activity/activity.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminManageController } from './admin-manage.controller';
import { AdminManageService } from './admin-manage.service';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [AdminController, AdminManageController],
  providers: [AdminService, AdminManageService],
  exports: [AdminService],
})
export class AdminModule {}
