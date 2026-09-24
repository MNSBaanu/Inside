import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const REVIEW_VISIBILITY_FILTERS = ['hidden', 'visible'] as const;

export class ListAdminReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: REVIEW_VISIBILITY_FILTERS,
    description:
      'hidden: waiting for approval or hidden by an admin. Omit for all.',
  })
  @IsOptional()
  @IsIn(REVIEW_VISIBILITY_FILTERS)
  visibility?: (typeof REVIEW_VISIBILITY_FILTERS)[number];
}
