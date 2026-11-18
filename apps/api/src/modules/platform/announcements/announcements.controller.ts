import {
  Body,
  Controller,
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
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@ApiTags('announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Current announcements for the signed-in user' })
  @ApiOkResponse({ description: 'Up to three active announcements' })
  active(@CurrentUser() user: AuthUser) {
    return this.announcements.active(user);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'List sent announcements' })
  @ApiOkResponse({ description: 'Announcements' })
  list(@Query() query: PaginationQueryDto) {
    return this.announcements.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Send an announcement to users' })
  @ApiCreatedResponse({ description: 'Sent' })
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateAnnouncementDto) {
    return this.announcements.create(admin, dto);
  }

  @Patch(':id/end')
  @ApiOperation({ summary: 'Stop showing an announcement' })
  @ApiOkResponse({ description: 'Ended' })
  end(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.announcements.end(admin, id);
  }
}
