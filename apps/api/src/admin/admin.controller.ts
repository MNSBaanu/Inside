import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetReviewVisibilityDto } from './dto/set-review-visibility.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Users' })
  users(@Query() query: PaginationQueryDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user (revokes sessions)' })
  @ApiOkResponse({ description: 'Suspended' })
  suspend(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.suspend(admin, id);
  }

  @Patch('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a user' })
  @ApiOkResponse({ description: 'Reactivated' })
  reactivate(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.reactivate(admin, id);
  }

  @Patch('users/:id/revoke-verification')
  @ApiOperation({ summary: "Remove a designer's verified badge" })
  @ApiOkResponse({ description: 'Badge removed' })
  revokeVerification(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.revokeVerification(admin, id);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List open + under-review reports' })
  @ApiOkResponse({ description: 'Reports' })
  reports(@Query() query: PaginationQueryDto) {
    return this.admin.listOpenReports(query);
  }

  @Patch('reports/:id/under-review')
  @ApiOperation({ summary: 'Mark a report under review' })
  @ApiOkResponse({ description: 'Under review' })
  underReview(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.markReportUnderReview(admin, id);
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve a report' })
  @ApiOkResponse({ description: 'Resolved' })
  resolveReport(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.resolveReport(admin, id);
  }

  @Patch('reports/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a report' })
  @ApiOkResponse({ description: 'Dismissed' })
  dismissReport(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.dismissReport(admin, id);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews for moderation' })
  @ApiOkResponse({ description: 'Reviews' })
  reviews() {
    return this.admin.listReviews();
  }

  @Patch('reviews/:id/visibility')
  @ApiOperation({ summary: 'Show or hide a review publicly' })
  @ApiOkResponse({ description: 'Updated' })
  setReviewVisibility(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetReviewVisibilityDto,
  ) {
    return this.admin.setReviewVisibility(user, id, dto.isVisible);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Platform activity and admin audit trail' })
  @ApiOkResponse({ description: 'Activity log entries, newest first' })
  activity(@Query() query: PaginationQueryDto) {
    return this.admin.listActivity(query);
  }
}
