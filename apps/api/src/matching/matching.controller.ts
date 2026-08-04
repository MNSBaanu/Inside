import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchingService } from './matching.service';

class MatchQueryDto {
  @ApiProperty()
  @IsUUID()
  briefId!: string;
}

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ClientModeGuard)
@Controller('match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('designers')
  @ApiOperation({ summary: 'Rank designers by fit score for a brief' })
  @ApiOkResponse({ description: 'Ranked designers' })
  match(@CurrentUser() user: AuthUser, @Query() query: MatchQueryDto) {
    return this.matchingService.matchDesigners(user, query.briefId);
  }
}
