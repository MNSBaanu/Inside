import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

@ApiTags('blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  @Get()
  @ApiOperation({ summary: 'List users I have blocked' })
  @ApiOkResponse({ description: 'Blocks' })
  list(@CurrentUser() user: AuthUser) {
    return this.blocks.listMine(user);
  }

  @Post()
  @ApiOperation({ summary: 'Block a user' })
  @ApiCreatedResponse({ description: 'Blocked' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBlockDto) {
    return this.blocks.create(user, dto);
  }

  @Delete(':blockedId')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiOkResponse({ description: 'Unblocked' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('blockedId', ParseUUIDPipe) blockedId: string,
  ) {
    return this.blocks.remove(user, blockedId);
  }
}
