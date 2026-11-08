import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportTargetType } from '@inside/database';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @ApiProperty()
  @IsUUID()
  targetId!: string;

  @ApiPropertyOptional({
    description: 'User id being reported (if applicable)',
  })
  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  details?: string;
}
