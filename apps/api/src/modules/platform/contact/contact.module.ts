import { Module } from '@nestjs/common';
import {
  AdminContactController,
  ContactController,
} from './contact.controller';
import { ContactService } from './contact.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ContactController, AdminContactController],
  providers: [ContactService],
})
export class ContactModule {}
