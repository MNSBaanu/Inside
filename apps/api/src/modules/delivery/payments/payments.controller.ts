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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
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

  @Get('payments/:id/invoice')
  @ApiOperation({
    summary:
      'Invoice for a paid milestone, from Stripe (client, designer or admin)',
  })
  @ApiOkResponse({ description: 'Invoice' })
  invoice(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payments.invoice(user, id);
  }

  @Post('payments/:id/checkout')
  @ApiOperation({ summary: 'Client starts a card payment for a milestone' })
  @ApiOkResponse({ description: 'Client secret' })
  checkout(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payments.createCheckout(user, id);
  }

  @Patch('payments/:id/pay')
  @ApiOperation({ summary: 'Confirm a completed Stripe payment' })
  @ApiOkResponse({ description: 'Paid' })
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayPaymentDto,
  ) {
    return this.payments.markPaid(user, id, dto);
  }
}
