import { Module } from '@nestjs/common';
import { BlocksModule } from '../../trust/blocks/blocks.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [BlocksModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
