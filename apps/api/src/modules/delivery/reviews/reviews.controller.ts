import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('projects/:projectId/reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Client reviews a completed project' })
  @ApiCreatedResponse({ description: 'Created' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user, projectId, dto);
  }

  @Get('designers/:designerId/reviews')
  @ApiOperation({ summary: 'Public reviews for a designer' })
  @ApiOkResponse({ description: 'Reviews with summary' })
  list(
    @Param('designerId', ParseUUIDPipe) designerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviews.listByDesigner(designerId, query);
  }
}
