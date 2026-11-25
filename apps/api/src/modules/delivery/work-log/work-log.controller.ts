import {
  Body,
  Controller,
  Delete,
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
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { WorkLogService } from './work-log.service';

@ApiTags('work-log')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class WorkLogController {
  constructor(private readonly workLog: WorkLogService) {}

  @Get('projects/:projectId/work-log')
  @ApiOperation({
    summary: 'Site visits, orders, deliveries and installation on a project',
  })
  @ApiOkResponse({ description: 'Work log entries, newest first' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.workLog.list(user, projectId);
  }

  @Post('projects/:projectId/work-log')
  @ApiOperation({ summary: 'Either party logs work that happened' })
  @ApiCreatedResponse({ description: 'Created' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateWorkLogDto,
  ) {
    return this.workLog.create(user, projectId, dto);
  }

  @Patch('work-log/:id/confirm')
  @ApiOperation({ summary: 'The other party confirms an entry' })
  @ApiOkResponse({ description: 'Confirmed' })
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workLog.confirm(user, id);
  }

  @Delete('work-log/:id')
  @ApiOperation({ summary: 'Author deletes an unconfirmed entry' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workLog.remove(user, id);
  }
}
