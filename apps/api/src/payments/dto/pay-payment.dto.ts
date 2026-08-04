import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PayPaymentDto {
  @ApiPropertyOptional({ description: 'Stripe payment intent id (stub)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  stripeIntentId?: string;
}
