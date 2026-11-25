import {
  Body,
  Controller,
  ForbiddenException,
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
import { Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { SupportService } from './support.service';

const ownThread = (user: AuthUser) => {
  if (user.role === Role.ADMIN) {
    throw new ForbiddenException('Admins use the admin support inbox');
  }
  return user.id;
};

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Unread support messages and the latest one' })
  @ApiOkResponse({ description: 'Summary' })
  summary(@CurrentUser() user: AuthUser) {
    return this.support.summary(user);
  }

  @Get('messages')
  @ApiOperation({ summary: 'My chat with Inside support' })
  @ApiOkResponse({ description: 'Messages' })
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.support.list(user, ownThread(user), query);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Message Inside support' })
  @ApiCreatedResponse({ description: 'Created' })
  send(@CurrentUser() user: AuthUser, @Body() dto: SendMessageDto) {
    return this.support.send(user, ownThread(user), dto);
  }

  @Patch('messages/read-all')
  @ApiOperation({ summary: 'Mark support replies read' })
  @ApiOkResponse({ description: 'Updated' })
  markAll(@CurrentUser() user: AuthUser) {
    return this.support.markAllRead(user, ownThread(user));
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Clients and designers, latest support chat first' })
  @ApiOkResponse({ description: 'Conversations' })
  conversations(@Query('search') search?: string) {
    return this.support.conversations(search);
  }

  @Get(':userId/messages')
  @ApiOperation({ summary: 'Support chat with one user' })
  @ApiOkResponse({ description: 'Messages' })
  list(
    @CurrentUser() admin: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.support.list(admin, userId, query);
  }

  @Post(':userId/messages')
  @ApiOperation({ summary: 'Reply to a user as Inside support' })
  @ApiCreatedResponse({ description: 'Created' })
  send(
    @CurrentUser() admin: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.support.send(admin, userId, dto);
  }

  @Patch(':userId/messages/read-all')
  @ApiOperation({ summary: 'Mark the user’s messages read' })
  @ApiOkResponse({ description: 'Updated' })
  markAll(
    @CurrentUser() admin: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.support.markAllRead(admin, userId);
  }
}
