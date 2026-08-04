import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PayPaymentDto } from './dto/pay-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('projects/:projectId/payments')
  @ApiOperation({ summary: 'List milestone payments (party access)' })
  @ApiOkResponse({ description: 'Payments' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.payments.listByProject(user, projectId);
  }

  @Patch('payments/:id/pay')
  @ApiOperation({ summary: 'Client marks a milestone paid (stub, no Stripe)' })
  @ApiOkResponse({ description: 'Paid' })
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayPaymentDto,
  ) {
    return this.payments.markPaid(user, id, dto);
  }

  @Patch('payments/:id/release')
  @ApiOperation({ summary: 'Release paid milestone to designer (client/admin)' })
  @ApiOkResponse({ description: 'Released' })
  release(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payments.release(user, id);
  }
}
