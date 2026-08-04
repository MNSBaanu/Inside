import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

@Module({
  imports: [NotificationsModule],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
