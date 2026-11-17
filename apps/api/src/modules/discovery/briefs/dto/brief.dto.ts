import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBriefDto {
  @ApiPropertyOptional({ description: 'Link to an existing moodboard' })
  @IsOptional()
  @IsUUID()
  moodboardId?: string;

  @ApiProperty({ example: ['Scandinavian', 'Minimalist'], type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  styles!: string[];

  @ApiProperty({ example: ['Living Room', 'Kitchen'], type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  rooms!: string[];

  @ApiPropertyOptional({ example: '400000-800000' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^(?=.*\d)[A-Za-z0-9\s.,-]+$/, {
    message: 'budgetRange must contain a number, e.g. 400000-800000',
  })
  budgetRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}

export class UpdateBriefDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  styles?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  rooms?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^(?=.*\d)[A-Za-z0-9\s.,-]+$/, {
    message: 'budgetRange must contain a number, e.g. 400000-800000',
  })
  budgetRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moodboardId?: string | null;
}

export class GenerateBriefDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rooms?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^(?=.*\d)[A-Za-z0-9\s.,-]+$/, {
    message: 'budgetRange must contain a number, e.g. 400000-800000',
  })
  budgetRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  description?: string;
}
