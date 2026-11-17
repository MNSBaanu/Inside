import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PayPaymentDto {
  @ApiProperty({ description: 'Stripe PaymentIntent id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  paymentIntentId!: string;
}
