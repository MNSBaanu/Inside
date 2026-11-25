import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { AskBotDto } from './dto/ask-bot.dto';
import { InsideBotService } from './inside-bot.service';

@ApiTags('bot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bot')
export class InsideBotController {
  constructor(private readonly bot: InsideBotService) {}

  @Get()
  @ApiOperation({ summary: 'Whether Inside Bot is available' })
  @ApiOkResponse({ description: 'Availability' })
  status() {
    return { success: true, data: { enabled: this.bot.enabled } };
  }

  @Post('ask')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ask Inside Bot a question' })
  @ApiOkResponse({ description: 'The reply, and whether to suggest support' })
  async ask(@CurrentUser() user: AuthUser, @Body() dto: AskBotDto) {
    return { success: true, data: await this.bot.ask(user, dto.turns) };
  }
}
