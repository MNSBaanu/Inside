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
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import {
  AdminContactQueryDto,
  CreateContactMessageDto,
  SetContactStatusDto,
} from './dto/contact.dto';
import { ContactService } from './contact.service';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send a message to the Inside team' })
  @ApiCreatedResponse({ description: 'Received' })
  create(@Body() dto: CreateContactMessageDto) {
    return this.contact.create(dto);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/contact')
export class AdminContactController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  @ApiOperation({ summary: 'List contact messages' })
  @ApiOkResponse({ description: 'Messages' })
  list(@Query() query: AdminContactQueryDto) {
    return this.contact.list(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change the status of a contact message' })
  @ApiOkResponse({ description: 'Updated' })
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetContactStatusDto,
  ) {
    return this.contact.setStatus(id, dto);
  }
}
