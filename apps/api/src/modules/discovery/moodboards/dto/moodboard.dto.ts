import { IsCloudinaryUrl } from '../../../../common/cloudinary-url';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const MAX_MOODBOARD_ITEMS = 100;
export const IMAGE_LOVES = [
  'Colour',
  'Lighting',
  'Furniture',
  'Texture',
  'Layout',
  'Overall vibe',
];
export const IMAGE_REACTIONS = ['love', 'dislike'];

export class MoodboardItemDto {
  @ApiProperty({ example: 'https://picsum.photos/seed/inspo/800/600' })
  @IsUrl({ require_tld: false })
  @IsCloudinaryUrl()
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

  @ApiPropertyOptional({ enum: IMAGE_LOVES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(IMAGE_LOVES, { each: true })
  loves?: string[];

  @ApiPropertyOptional({ enum: IMAGE_REACTIONS })
  @IsOptional()
  @IsIn(IMAGE_REACTIONS)
  reaction?: string;

  @ApiPropertyOptional({ description: 'Linked shop product slug' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/i)
  productSlug?: string;

  @ApiPropertyOptional({ description: 'Product price when saved' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productPrice?: number;
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

  @ApiPropertyOptional({ example: ['Calm', 'Warm', 'Natural'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  moodWords?: string[];

  @ApiPropertyOptional({ example: ['Sage', 'Oak', 'Cream'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  palette?: string[];
}

export class AddMoodboardItemDto extends MoodboardItemDto {}
