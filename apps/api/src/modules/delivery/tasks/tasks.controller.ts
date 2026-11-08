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
import { DesignerModeGuard } from '../../identity/auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('stages/:stageId/tasks')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List tasks for a stage (party access)' })
  @ApiOkResponse({ description: 'Tasks' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ) {
    return this.tasks.listByStage(user, stageId);
  }

  @Post('stages/:stageId/tasks')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer adds a task to a stage' })
  @ApiCreatedResponse({ description: 'Created' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(user, stageId, dto.title);
  }

  @Patch('tasks/:id')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer marks a task done or not done' })
  @ApiOkResponse({ description: 'Updated' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.setDone(user, id, dto.isDone);
  }

  @Delete('tasks/:id')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer deletes a task' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.remove(user, id);
  }
}
