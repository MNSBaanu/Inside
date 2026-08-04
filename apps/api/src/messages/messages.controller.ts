import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('projects/:projectId/messages')
  @ApiOperation({ summary: 'List messages in a project (party access)' })
  @ApiOkResponse({ description: 'Messages' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.messages.list(user, projectId);
  }

  @Post('projects/:projectId/messages')
  @ApiOperation({ summary: 'Send a message to the other party' })
  @ApiCreatedResponse({ description: 'Created' })
  send(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.send(user, projectId, dto);
  }

  @Patch('projects/:projectId/messages/read-all')
  @ApiOperation({ summary: 'Mark all my received messages read' })
  @ApiOkResponse({ description: 'Updated' })
  markAll(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.messages.markAllRead(user, projectId);
  }

  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Mark one received message read' })
  @ApiOkResponse({ description: 'Updated' })
  markOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messages.markRead(user, id);
  }
}
