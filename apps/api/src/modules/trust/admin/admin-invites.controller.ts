import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { AdminInvitesService } from './admin-invites.service';
import {
  AcceptAdminInviteDto,
  CreateAdminInviteDto,
} from './dto/admin-invite.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/invites')
export class AdminInvitesController {
  constructor(private readonly invites: AdminInvitesService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Email an admin invite (platform owner only)' })
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateAdminInviteDto) {
    return this.invites.create(admin, dto.email);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Pending admin invites (platform owner only)' })
  list(@CurrentUser() admin: AuthUser) {
    return this.invites.list(admin);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an admin invite as the invited user' })
  accept(@CurrentUser() user: AuthUser, @Body() dto: AcceptAdminInviteDto) {
    return this.invites.accept(user, dto.token);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Revoke a pending invite (platform owner only)' })
  revoke(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invites.revoke(admin, id);
  }
}
