import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../delivery/payments/payments.module';
import { ActivityModule } from '../../platform/activity/activity.module';
import { EmailModule } from '../../platform/email/email.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { AdminImportController } from './admin-import.controller';
import { AdminImportService } from './admin-import.service';
import { AdminInvitesController } from './admin-invites.controller';
import { AdminInvitesService } from './admin-invites.service';
import { AdminController } from './admin.controller';
import { AdminManageController } from './admin-manage.controller';
import { AdminManageService } from './admin-manage.service';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule, ActivityModule, EmailModule, PaymentsModule],
  controllers: [
    AdminController,
    AdminManageController,
    AdminInvitesController,
    AdminImportController,
  ],
  providers: [
    AdminService,
    AdminManageService,
    AdminInvitesService,
    AdminImportService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
