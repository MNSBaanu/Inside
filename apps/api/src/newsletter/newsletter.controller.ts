import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Subscribe an email address to product updates' })
  @ApiCreatedResponse({ description: 'Subscribed' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto.email);
  }
}
