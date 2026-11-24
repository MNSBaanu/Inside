import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { MoodboardsController } from './moodboards.controller';
import { MoodboardsService } from './moodboards.service';

@Module({
  imports: [NotificationsModule],
  controllers: [MoodboardsController],
  providers: [MoodboardsService],
  exports: [MoodboardsService],
})
export class MoodboardsModule {}
