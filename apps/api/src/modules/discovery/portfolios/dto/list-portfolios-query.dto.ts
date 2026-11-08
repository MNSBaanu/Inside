import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ListPortfoliosQueryDto {
  @ApiPropertyOptional({ description: 'Search title, description or designer' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'Colombo',
    description: "Designer's location",
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Scandinavian' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ example: 'Living Room' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @ApiPropertyOptional({ example: 800000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @ApiPropertyOptional({ description: 'Filter by designer id' })
  @IsOptional()
  @IsUUID()
  designerId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
