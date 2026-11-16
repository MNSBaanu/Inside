import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser, RequestUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SwitchActiveRoleDto } from './dto/switch-active-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Profile' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Updated profile' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Change password (revokes refresh sessions)' })
  @ApiOkResponse({ description: 'Password changed' })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Patch('me/active-role')
  @ApiOperation({
    summary: 'Switch activeRole (designers: CLIENT ↔ DESIGNER)',
  })
  @ApiOkResponse({ description: 'Updated role and new access token' })
  switchActiveRole(
    @CurrentUser() user: RequestUser,
    @Body() dto: SwitchActiveRoleDto,
  ) {
    return this.usersService.switchActiveRole(user.id, user.sessionId, dto);
  }

  @Post('me/client-account')
  @ApiOperation({ summary: 'Designer opts in to a client account' })
  @ApiOkResponse({ description: 'Updated user' })
  createClientAccount(@CurrentUser() user: AuthUser) {
    return this.usersService.createClientAccount(user.id);
  }

  @Post('me/designer-account')
  @ApiOperation({ summary: 'Client opts in to a designer account' })
  @ApiOkResponse({ description: 'Updated role and new access token' })
  createDesignerAccount(@CurrentUser() user: RequestUser) {
    return this.usersService.createDesignerAccount(user.id, user.sessionId);
  }
}
