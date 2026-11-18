import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../delivery/payments/payments.module';
import { ActivityModule } from '../../platform/activity/activity.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminManageController } from './admin-manage.controller';
import { AdminManageService } from './admin-manage.service';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule, ActivityModule, PaymentsModule],
  controllers: [AdminController, AdminManageController],
  providers: [AdminService, AdminManageService],
  exports: [AdminService],
})
export class AdminModule {}
