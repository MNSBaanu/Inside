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
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { DesignerModeGuard } from '../../identity/auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListOpenRequestsQueryDto } from './dto/list-open-requests-query.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Create a project request (client)' })
  @ApiCreatedResponse({ description: 'Created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my requests (client or designer view)' })
  @ApiOkResponse({ description: 'Requests' })
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.requestsService.listMine(user, query);
  }

  @Get('open')
  @ApiOperation({ summary: 'List open requests publicly (no client details)' })
  @ApiOkResponse({ description: 'Open requests' })
  listOpen(@Query() query: ListOpenRequestsQueryDto) {
    return this.requestsService.listOpen(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get request by id (party access)' })
  @ApiOkResponse({ description: 'Request' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.getById(user, id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Cancel request (client owner)' })
  @ApiOkResponse({ description: 'Cancelled' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.cancel(user, id);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Close OPEN request (client owner)' })
  @ApiOkResponse({ description: 'Closed' })
  close(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.requestsService.close(user, id);
  }

  @Patch(':id/decline')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Decline a direct request (assigned designer)' })
  @ApiOkResponse({ description: 'Declined' })
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.decline(user, id);
  }
}
