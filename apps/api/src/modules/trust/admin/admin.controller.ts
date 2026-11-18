import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import {
  AdminActivityQueryDto,
  AdminAnalyticsQueryDto,
  AdminReportsQueryDto,
  AdminReviewsQueryDto,
  AdminSearchQueryDto,
  AdminUsersQueryDto,
} from './dto/admin-list-query.dto';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { SetReviewVisibilityDto } from './dto/set-review-visibility.dto';
import { AdminService } from './admin.service';
import { ReportDecisionDto } from './dto/report-decision.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform totals for the admin overview' })
  @ApiOkResponse({ description: 'Counts' })
  stats() {
    return this.admin.getStats();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Growth, revenue and activity trends for the admin',
  })
  @ApiOkResponse({ description: 'Analytics for the selected months' })
  analytics(@Query() query: AdminAnalyticsQueryDto) {
    return this.admin.getAnalytics(query.months);
  }

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Users' })
  users(@Query() query: AdminUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Get('users/export')
  @ApiOperation({ summary: 'All users matching the filters, for CSV export' })
  @ApiOkResponse({ description: 'Users' })
  exportUsers(@Query() query: AdminUsersQueryDto) {
    return this.admin.exportUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a client or designer account' })
  @ApiCreatedResponse({ description: 'Created' })
  createUser(@CurrentUser() admin: AuthUser, @Body() dto: AdminCreateUserDto) {
    return this.admin.createUser(admin, dto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'User details with activity counts' })
  @ApiOkResponse({ description: 'User' })
  user(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getUser(id);
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

  @Patch('users/:id/make-admin')
  @ApiOperation({ summary: 'Give a user admin access (platform owner only)' })
  @ApiOkResponse({ description: 'Now an admin' })
  makeAdmin(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.makeAdmin(admin, id);
  }

  @Patch('users/:id/remove-admin')
  @ApiOperation({ summary: 'Remove admin access (platform owner only)' })
  @ApiOkResponse({ description: 'Admin access removed' })
  removeAdmin(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.removeAdmin(admin, id);
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
  reports(@Query() query: AdminReportsQueryDto) {
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
    @Body() dto: ReportDecisionDto,
  ) {
    return this.admin.resolveReport(admin, id, dto);
  }

  @Patch('reports/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a report' })
  @ApiOkResponse({ description: 'Dismissed' })
  dismissReport(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportDecisionDto,
  ) {
    return this.admin.dismissReport(admin, id, dto);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews for moderation' })
  @ApiOkResponse({ description: 'Reviews' })
  reviews(@Query() query: AdminReviewsQueryDto) {
    return this.admin.listReviews(query);
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

  @Get('newsletter')
  @ApiOperation({ summary: 'Newsletter subscribers' })
  @ApiOkResponse({ description: 'Subscribers' })
  newsletter(@Query() query: AdminSearchQueryDto) {
    return this.admin.listNewsletter(query);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Platform activity and admin audit trail' })
  @ApiOkResponse({ description: 'Activity log entries, newest first' })
  activity(@Query() query: AdminActivityQueryDto) {
    return this.admin.listActivity(query);
  }
}
