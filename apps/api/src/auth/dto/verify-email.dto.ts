import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Raw token from the verification link/email' })
  @IsString()
  @MinLength(20)
  token!: string;
}
