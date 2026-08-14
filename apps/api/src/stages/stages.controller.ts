import {
  Body,
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
import { ClientModeGuard } from '../auth/guards/client-mode.guard';
import { DesignerModeGuard } from '../auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateStageDueDateDto } from './dto/update-stage-due-date.dto';
import { RejectStageDto } from './dto/reject-stage.dto';
import { StagesService } from './stages.service';

@ApiTags('stages')
@ApiBearerAuth()
@Controller()
export class StagesController {
  constructor(private readonly stages: StagesService) {}

  @Get('projects/:projectId/stages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List stages for a project (party access)' })
  @ApiOkResponse({ description: 'Stages' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.stages.listByProject(user, projectId);
  }

  @Patch('stages/:id/due-date')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set or clear a stage due date (either party)' })
  @ApiOkResponse({ description: 'Updated' })
  setDueDate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStageDueDateDto,
  ) {
    return this.stages.setDueDate(user, id, dto.dueDate ?? null);
  }

  @Patch('stages/:id/start')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer starts a stage (PENDING → IN_PROGRESS)' })
  @ApiOkResponse({ description: 'Started' })
  start(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.stages.start(user, id);
  }

  @Patch('stages/:id/submit')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer submits a stage for approval' })
  @ApiOkResponse({ description: 'Submitted' })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.stages.submit(user, id);
  }

  @Patch('stages/:id/approve')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({
    summary: 'Client approves a submitted stage; advances project',
  })
  @ApiOkResponse({ description: 'Approved' })
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.stages.approve(user, id);
  }

  @Patch('stages/:id/reject')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Client rejects a submitted stage' })
  @ApiOkResponse({ description: 'Rejected' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectStageDto,
  ) {
    return this.stages.reject(user, id, dto.reason);
  }
}
