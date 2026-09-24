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
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
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

  @Get('projects/:projectId/reviews/mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "The current user's review of a project, if any" })
  @ApiOkResponse({ description: 'The review, or null' })
  mine(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.reviews.findMine(user, projectId);
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
