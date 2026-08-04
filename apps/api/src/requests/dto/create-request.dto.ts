import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestType } from '@inside/database';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ example: 'Living room refresh' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({ enum: RequestType })
  @IsEnum(RequestType)
  type!: RequestType;

  @ApiPropertyOptional({ description: 'Required for DIRECT requests' })
  @ValidateIf((o: CreateRequestDto) => o.type === RequestType.DIRECT)
  @IsUUID()
  designerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  briefId?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  budget?: number;
}
