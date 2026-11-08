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
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { FavouritesService } from './favourites.service';

@ApiTags('favourites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ClientModeGuard)
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get()
  @ApiOperation({ summary: 'List my favourite designers' })
  @ApiOkResponse({ description: 'Favourites' })
  list(@CurrentUser() user: AuthUser) {
    return this.favouritesService.listMine(user);
  }

  @Post()
  @ApiOperation({ summary: 'Favourite a designer' })
  @ApiCreatedResponse({ description: 'Created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFavouriteDto) {
    return this.favouritesService.create(user, dto);
  }

  @Delete(':designerId')
  @ApiOperation({ summary: 'Remove designer from favourites' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('designerId', ParseUUIDPipe) designerId: string,
  ) {
    return this.favouritesService.removeByDesignerId(user, designerId);
  }
}
