import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { ClientModeGuard } from '../auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AddMoodboardItemDto,
  CreateMoodboardDto,
  UpdateMoodboardDto,
} from './dto/moodboard.dto';
import { MoodboardsService } from './moodboards.service';

@ApiTags('moodboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ClientModeGuard)
@Controller('moodboards')
export class MoodboardsController {
  constructor(private readonly moodboardsService: MoodboardsService) {}

  @Get()
  @ApiOperation({ summary: 'List my moodboards' })
  @ApiOkResponse({ description: 'Moodboards' })
  list(@CurrentUser() user: AuthUser) {
    return this.moodboardsService.listMine(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get moodboard' })
  @ApiOkResponse({ description: 'Moodboard' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.moodboardsService.getById(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create moodboard' })
  @ApiCreatedResponse({ description: 'Created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMoodboardDto) {
    return this.moodboardsService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update moodboard' })
  @ApiOkResponse({ description: 'Updated' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMoodboardDto,
  ) {
    return this.moodboardsService.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete moodboard' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.moodboardsService.remove(user, id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add inspiration item' })
  @ApiCreatedResponse({ description: 'Item added' })
  addItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMoodboardItemDto,
  ) {
    return this.moodboardsService.addItem(user, id, dto);
  }

  @Delete(':id/items/:index')
  @ApiOperation({ summary: 'Remove inspiration item by index' })
  @ApiOkResponse({ description: 'Item removed' })
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.moodboardsService.removeItem(user, id, index);
  }
}
