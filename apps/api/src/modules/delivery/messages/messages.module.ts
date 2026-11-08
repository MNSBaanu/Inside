import { Module } from '@nestjs/common';
import { BlocksModule } from '../../trust/blocks/blocks.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [NotificationsModule, BlocksModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
