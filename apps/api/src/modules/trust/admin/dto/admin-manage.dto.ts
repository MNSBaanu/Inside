import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ProjectStatus, RequestStatus, StageName } from '@inside/database';
import { AdminSearchQueryDto } from './admin-list-query.dto';

export class AdminProjectsQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsIn(Object.values(ProjectStatus))
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: StageName })
  @IsOptional()
  @IsIn(Object.values(StageName))
  stage?: StageName;
}

export class AdminCancelProjectDto {
  @ApiProperty({ example: 'Breach of platform rules' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class AdminProductsQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  seller?: string;

  @ApiPropertyOptional({ enum: ['published', 'hidden'] })
  @IsOptional()
  @IsIn(['published', 'hidden'])
  visibility?: 'published' | 'hidden';
}

export class AdminCreateProductDto {
  @ApiProperty({ example: 'Oak lounge sofa' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ example: 'Sofas' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  category!: string;

  @ApiPropertyOptional({ example: 'Japandi' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  style?: string;

  @ApiProperty({ example: 185000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  imageUrl!: string;

  @ApiProperty({ example: 'Damro' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  sellerName!: string;

  @ApiProperty()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  sellerUrl!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class AdminUpdateProductDto extends PartialType(AdminCreateProductDto) {}

export class AdminOpenRequestsQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsIn(Object.values(RequestStatus))
  status?: RequestStatus;
}

export const ADMIN_REQUEST_STATUSES = [
  RequestStatus.OPEN,
  RequestStatus.CLOSED,
  RequestStatus.CANCELLED,
] as const;

export class AdminSetRequestStatusDto {
  @ApiProperty({ enum: ADMIN_REQUEST_STATUSES })
  @IsIn(ADMIN_REQUEST_STATUSES)
  status!: (typeof ADMIN_REQUEST_STATUSES)[number];
}
