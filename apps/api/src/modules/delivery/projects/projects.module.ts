import { Module } from '@nestjs/common';
import { ActivityModule } from '../../platform/activity/activity.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [NotificationsModule, ActivityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
