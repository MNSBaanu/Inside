import {
  Body,
  Controller,
  Delete,
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
import { DesignerModeGuard } from '../../identity/auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../identity/auth/guards/optional-jwt-auth.guard';
import { AddPortfolioImageDto } from './dto/add-portfolio-image.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { ListPortfoliosQueryDto } from './dto/list-portfolios-query.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfoliosService } from './portfolios.service';

@ApiTags('portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  @ApiOperation({ summary: 'List published portfolios (filters + pagination)' })
  @ApiOkResponse({ description: 'Portfolio page' })
  list(@Query() query: ListPortfoliosQueryDto) {
    return this.portfoliosService.listPublic(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my portfolios (including drafts)' })
  @ApiOkResponse({ description: 'Own portfolios' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.portfoliosService.listMine(user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio by id (owners can view drafts)' })
  @ApiOkResponse({ description: 'Portfolio detail' })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.portfoliosService.getById(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create portfolio (designer mode)' })
  @ApiCreatedResponse({ description: 'Created portfolio' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePortfolioDto) {
    return this.portfoliosService.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own portfolio' })
  @ApiOkResponse({ description: 'Updated portfolio' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.portfoliosService.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own portfolio' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.portfoliosService.remove(user, id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add image to own portfolio' })
  @ApiCreatedResponse({ description: 'Created image' })
  addImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPortfolioImageDto,
  ) {
    return this.portfoliosService.addImage(user, id, dto);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from own portfolio' })
  @ApiOkResponse({ description: 'Deleted' })
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.portfoliosService.removeImage(user, id, imageId);
  }
}
