import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export const OPEN_REQUEST_SORTS = [
  'newest',
  'budget_high',
  'budget_low',
] as const;
export type OpenRequestSort = (typeof OPEN_REQUEST_SORTS)[number];

export class ListOpenRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search title or description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Colombo', description: "Client's location" })
  @IsOptional()
  @IsString()
  location?: string;

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

  @ApiPropertyOptional({ enum: OPEN_REQUEST_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn(OPEN_REQUEST_SORTS)
  sort?: OpenRequestSort;
}
