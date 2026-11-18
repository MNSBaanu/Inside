import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AccountStatus,
  ReportStatus,
  ReportTargetType,
  Role,
} from '@inside/database';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class AdminSearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive text search' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminUsersQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsIn(Object.values(AccountStatus))
  status?: AccountStatus;
}

export class AdminReportsQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ enum: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW] })
  @IsOptional()
  @IsIn([ReportStatus.OPEN, ReportStatus.UNDER_REVIEW])
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: ReportTargetType })
  @IsOptional()
  @IsIn(Object.values(ReportTargetType))
  targetType?: ReportTargetType;
}

export class AdminReviewsQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ enum: ['visible', 'hidden'] })
  @IsOptional()
  @IsIn(['visible', 'hidden'])
  visibility?: 'visible' | 'hidden';

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class AdminAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: [3, 6, 12, 24], default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsIn([3, 6, 12, 24])
  months?: number;
}

export class AdminActivityQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ description: 'Activity action, e.g. USER_SUSPENDED' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  action?: string;
}
