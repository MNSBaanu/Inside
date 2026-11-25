import { Module } from '@nestjs/common';
import { InsideBotController } from './inside-bot.controller';
import { InsideBotService } from './inside-bot.service';

@Module({
  controllers: [InsideBotController],
  providers: [InsideBotService],
})
export class InsideBotModule {}
