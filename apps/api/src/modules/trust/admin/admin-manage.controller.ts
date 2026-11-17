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
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import {
  AdminCancelProjectDto,
  AdminCreateProductDto,
  AdminOpenRequestsQueryDto,
  AdminProductsQueryDto,
  AdminProjectsQueryDto,
  AdminSetRequestStatusDto,
  AdminUpdateProductDto,
} from './dto/admin-manage.dto';
import { AdminManageService } from './admin-manage.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminManageController {
  constructor(private readonly manage: AdminManageService) {}

  @Get('projects')
  @ApiOperation({ summary: 'List projects' })
  @ApiOkResponse({ description: 'Projects' })
  projects(@Query() query: AdminProjectsQueryDto) {
    return this.manage.listProjects(query);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Project details with stages and payments' })
  @ApiOkResponse({ description: 'Project' })
  project(@Param('id', ParseUUIDPipe) id: string) {
    return this.manage.getProject(id);
  }

  @Patch('projects/:id/hold')
  @ApiOperation({ summary: 'Put a project on hold' })
  @ApiOkResponse({ description: 'On hold' })
  holdProject(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.manage.holdProject(admin, id);
  }

  @Patch('projects/:id/resume')
  @ApiOperation({ summary: 'Make an on-hold project active again' })
  @ApiOkResponse({ description: 'Active' })
  resumeProject(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.manage.resumeProject(admin, id);
  }

  @Patch('projects/:id/cancel')
  @ApiOperation({ summary: 'Cancel a project' })
  @ApiOkResponse({ description: 'Cancelled' })
  cancelProject(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminCancelProjectDto,
  ) {
    return this.manage.cancelProject(admin, id, dto.reason.trim());
  }

  @Get('products')
  @ApiOperation({ summary: 'List shop items, published or not' })
  @ApiOkResponse({ description: 'Products' })
  products(@Query() query: AdminProductsQueryDto) {
    return this.manage.listProducts(query);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a shop item' })
  @ApiCreatedResponse({ description: 'Created' })
  createProduct(
    @CurrentUser() admin: AuthUser,
    @Body() dto: AdminCreateProductDto,
  ) {
    return this.manage.createProduct(admin, dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Edit, publish or hide a shop item' })
  @ApiOkResponse({ description: 'Updated' })
  updateProduct(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateProductDto,
  ) {
    return this.manage.updateProduct(admin, id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a shop item' })
  @ApiOkResponse({ description: 'Deleted' })
  deleteProduct(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.manage.deleteProduct(admin, id);
  }

  @Get('open-projects')
  @ApiOperation({ summary: 'List open project requests' })
  @ApiOkResponse({ description: 'Open projects' })
  openProjects(@Query() query: AdminOpenRequestsQueryDto) {
    return this.manage.listOpenRequests(query);
  }

  @Patch('open-projects/:id/status')
  @ApiOperation({ summary: 'Reopen, close or cancel an open project' })
  @ApiOkResponse({ description: 'Updated' })
  setOpenProjectStatus(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminSetRequestStatusDto,
  ) {
    return this.manage.setOpenRequestStatus(admin, id, dto);
  }
}
