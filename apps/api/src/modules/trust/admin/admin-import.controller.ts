import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { AdminGuard } from '../../identity/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { AdminImportService } from './admin-import.service';
import { ImportRowsDto } from './dto/admin-import.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/import')
export class AdminImportController {
  constructor(private readonly importer: AdminImportService) {}

  @Post('users')
  @ApiOperation({ summary: 'Bulk create users from CSV rows' })
  users(@CurrentUser() admin: AuthUser, @Body() dto: ImportRowsDto) {
    return this.importer.importUsers(admin, dto.rows);
  }

  @Post('products')
  @ApiOperation({ summary: 'Bulk create shop products from CSV rows' })
  products(@CurrentUser() admin: AuthUser, @Body() dto: ImportRowsDto) {
    return this.importer.importProducts(admin, dto.rows);
  }

  @Post('subscribers')
  @ApiOperation({ summary: 'Bulk add newsletter subscribers from CSV rows' })
  subscribers(@CurrentUser() admin: AuthUser, @Body() dto: ImportRowsDto) {
    return this.importer.importSubscribers(admin, dto.rows);
  }
}
