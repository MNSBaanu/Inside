import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
