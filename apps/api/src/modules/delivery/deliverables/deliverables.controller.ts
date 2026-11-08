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
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { DesignerModeGuard } from '../../identity/auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { DeliverablesService } from './deliverables.service';
import {
  CreateDeliverableDto,
  UpdateDeliverableFeedbackDto,
} from './dto/create-deliverable.dto';

@ApiTags('deliverables')
@ApiBearerAuth()
@Controller()
export class DeliverablesController {
  constructor(private readonly deliverables: DeliverablesService) {}

  @Get('stages/:stageId/deliverables')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List deliverables for a stage (party access)' })
  @ApiOkResponse({ description: 'Deliverables' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ) {
    return this.deliverables.listByStage(user, stageId);
  }

  @Post('stages/:stageId/deliverables')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer uploads a deliverable (auto-versioned)' })
  @ApiCreatedResponse({ description: 'Created' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.deliverables.create(user, stageId, dto);
  }

  @Patch('deliverables/:id/feedback')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Client sets feedback on a deliverable' })
  @ApiOkResponse({ description: 'Updated' })
  feedback(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliverableFeedbackDto,
  ) {
    return this.deliverables.setFeedback(user, id, dto);
  }
}
