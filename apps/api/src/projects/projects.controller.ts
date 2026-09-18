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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CancelProjectDto } from './dto/cancel-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List my projects (party = client or designer)' })
  @ApiOkResponse({ description: 'Projects' })
  list(@CurrentUser() user: AuthUser) {
    return this.projects.listMine(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id (party access)' })
  @ApiOkResponse({ description: 'Project' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.getById(user, id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'List project activity log (party access)' })
  @ApiOkResponse({ description: 'Activity' })
  activity(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.listActivity(user, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel project (either party)' })
  @ApiOkResponse({ description: 'Cancelled' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelProjectDto,
  ) {
    return this.projects.cancel(user, id, dto.reason);
  }

  @Patch(':id/on-hold')
  @ApiOperation({ summary: 'Place active project on hold (either party)' })
  @ApiOkResponse({ description: 'On hold' })
  onHold(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.putOnHold(user, id);
  }

  @Patch(':id/resume')
  @ApiOperation({
    summary: 'Resume on-hold project (the party who put it on hold)',
  })
  @ApiOkResponse({ description: 'Active' })
  resume(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.resume(user, id);
  }
}
