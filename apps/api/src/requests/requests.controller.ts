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
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../auth/guards/client-mode.guard';
import { DesignerModeGuard } from '../auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateRequestDto } from './dto/create-request.dto';
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
