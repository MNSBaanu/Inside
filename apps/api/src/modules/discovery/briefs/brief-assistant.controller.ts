import {
  Body,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { BriefAssistantService } from './brief-assistant.service';
import { AssistBriefDto } from './dto/assist-brief.dto';

@ApiTags('briefs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ClientModeGuard)
@Controller('briefs/assistant')
export class BriefAssistantController {
  constructor(private readonly assistant: BriefAssistantService) {}

  @Get()
  @ApiOperation({ summary: 'Whether the brief assistant is available' })
  @ApiOkResponse({ description: 'Availability' })
  status() {
    return { success: true, data: { enabled: this.assistant.enabled } };
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Suggest brief details from a free-text description',
  })
  @ApiOkResponse({ description: 'Suggested rooms, styles, budget and summary' })
  async suggest(@Body() dto: AssistBriefDto) {
    if (!this.assistant.enabled) {
      throw new ServiceUnavailableException(
        'The brief assistant is not available right now.',
      );
    }
    return { success: true, data: await this.assistant.suggest(dto.text) };
  }
}
