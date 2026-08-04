import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  users() {
    return this.admin.listUsers();
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

  @Get('reports')
  @ApiOperation({ summary: 'List open + under-review reports' })
  @ApiOkResponse({ description: 'Reports' })
  reports() {
    return this.admin.listOpenReports();
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
}
