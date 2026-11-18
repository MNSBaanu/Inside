import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import {
  AdminAnnouncementsController,
  AnnouncementsController,
} from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [ActivityModule],
  controllers: [AnnouncementsController, AdminAnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
