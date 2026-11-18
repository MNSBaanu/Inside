import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AnnouncementAudience, AnnouncementTone } from '@inside/database';

export class CreateAnnouncementDto {
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  title!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional({ enum: AnnouncementAudience, default: 'ALL' })
  @IsOptional()
  @IsIn(Object.values(AnnouncementAudience))
  audience?: AnnouncementAudience;

  @ApiPropertyOptional({ enum: AnnouncementTone, default: 'INFO' })
  @IsOptional()
  @IsIn(Object.values(AnnouncementTone))
  tone?: AnnouncementTone;

  @ApiPropertyOptional({ description: 'When the banner stops showing' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
