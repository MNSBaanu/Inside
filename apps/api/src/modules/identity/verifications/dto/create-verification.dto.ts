import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVerificationDto {
  @ApiProperty({ example: 'https://cdn.example.com/id.pdf' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MinLength(4)
  @MaxLength(2000)
  evidenceUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class RejectVerificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
