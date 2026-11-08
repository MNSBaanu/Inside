import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PayPaymentDto {
  @ApiProperty({ description: 'Stripe Checkout session id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  sessionId!: string;
}
