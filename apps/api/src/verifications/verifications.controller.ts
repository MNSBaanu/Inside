import {
  Body,
  Controller,
  Get,
  Param,
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
import { AdminGuard } from '../auth/guards/admin.guard';
import { DesignerModeGuard } from '../auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateVerificationDto,
  RejectVerificationDto,
} from './dto/create-verification.dto';
import { VerificationsService } from './verifications.service';

@ApiTags('verifications')
@ApiBearerAuth()
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verifications: VerificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Designer submits a verification request' })
  @ApiCreatedResponse({ description: 'Submitted' })
  submit(@CurrentUser() user: AuthUser, @Body() dto: CreateVerificationDto) {
    return this.verifications.submit(user, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'List my verification requests' })
  @ApiOkResponse({ description: 'Verifications' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.verifications.listMine(user);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: list pending verification queue' })
  @ApiOkResponse({ description: 'Pending' })
  listPending() {
    return this.verifications.listPending();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: approve verification (sets isVerified)' })
  @ApiOkResponse({ description: 'Approved' })
  approve(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.verifications.approve(admin, id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: reject verification' })
  @ApiOkResponse({ description: 'Rejected' })
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.verifications.reject(admin, id, dto);
  }
}
