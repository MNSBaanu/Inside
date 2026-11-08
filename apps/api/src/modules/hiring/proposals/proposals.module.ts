import { Module } from '@nestjs/common';
import { ActivityModule } from '../../platform/activity/activity.module';
import { BlocksModule } from '../../trust/blocks/blocks.module';
import { NotificationsModule } from '../../platform/notifications/notifications.module';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';

@Module({
  imports: [NotificationsModule, ActivityModule, BlocksModule],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
