import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export function paginate(query: PaginationQueryDto, defaultPageSize = 50) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? defaultPageSize;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
