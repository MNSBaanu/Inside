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
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import {
  CreateBriefDto,
  GenerateBriefDto,
  UpdateBriefDto,
} from './dto/brief.dto';
import { BriefsService } from './briefs.service';

@ApiTags('briefs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ClientModeGuard)
@Controller()
export class BriefsController {
  constructor(private readonly briefsService: BriefsService) {}

  @Get('briefs')
  @ApiOperation({ summary: 'List my briefs' })
  @ApiOkResponse({ description: 'Briefs' })
  list(@CurrentUser() user: AuthUser) {
    return this.briefsService.listMine(user);
  }

  @Get('briefs/:id')
  @ApiOperation({ summary: 'Get brief' })
  @ApiOkResponse({ description: 'Brief' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.briefsService.getById(user, id);
  }

  @Post('briefs')
  @ApiOperation({ summary: 'Create brief' })
  @ApiCreatedResponse({ description: 'Created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBriefDto) {
    return this.briefsService.create(user, dto);
  }

  @Post('moodboards/:moodboardId/briefs')
  @ApiOperation({ summary: 'Generate brief from moodboard' })
  @ApiCreatedResponse({ description: 'Generated brief' })
  generate(
    @CurrentUser() user: AuthUser,
    @Param('moodboardId', ParseUUIDPipe) moodboardId: string,
    @Body() dto: GenerateBriefDto,
  ) {
    return this.briefsService.generateFromMoodboard(user, moodboardId, dto);
  }

  @Patch('briefs/:id')
  @ApiOperation({ summary: 'Update brief' })
  @ApiOkResponse({ description: 'Updated' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBriefDto,
  ) {
    return this.briefsService.update(user, id, dto);
  }

  @Delete('briefs/:id')
  @ApiOperation({ summary: 'Delete brief' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.briefsService.remove(user, id);
  }
}
