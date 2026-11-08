import { Module } from '@nestjs/common';
import { BriefAssistantController } from './brief-assistant.controller';
import { BriefAssistantService } from './brief-assistant.service';
import { BriefsController } from './briefs.controller';
import { BriefsService } from './briefs.service';

@Module({
  controllers: [BriefAssistantController, BriefsController],
  providers: [BriefsService, BriefAssistantService],
  exports: [BriefsService],
})
export class BriefsModule {}
