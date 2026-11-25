import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WorkLogType } from '@inside/database';

export class CreateWorkLogDto {
  @ApiProperty({ enum: WorkLogType })
  @IsIn(Object.values(WorkLogType))
  type!: WorkLogType;

  @ApiProperty({ example: 'Site visit and measurements' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  @Matches(/^https:\/\/res\.cloudinary\.com\//, {
    each: true,
    message: 'Photos must be uploaded through the platform',
  })
  photos?: string[];

  @ApiProperty({ example: '2026-11-26T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  happenedAt!: Date;
}
