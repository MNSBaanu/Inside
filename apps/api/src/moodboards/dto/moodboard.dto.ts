import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const MAX_MOODBOARD_ITEMS = 100;

export class MoodboardItemDto {
  @ApiProperty({ example: 'https://picsum.photos/seed/inspo/800/600' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'Warm neutrals' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @ApiPropertyOptional({ description: 'Optional linked portfolio id' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;
}

export class CreateMoodboardDto {
  @ApiProperty({ example: 'Apartment Refresh' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ type: [MoodboardItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_MOODBOARD_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => MoodboardItemDto)
  savedItems?: MoodboardItemDto[];
}

export class UpdateMoodboardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ type: [MoodboardItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_MOODBOARD_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => MoodboardItemDto)
  savedItems?: MoodboardItemDto[];
}

export class AddMoodboardItemDto extends MoodboardItemDto {}
