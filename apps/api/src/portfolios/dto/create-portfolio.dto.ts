import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePortfolioImageDto {
  @ApiProperty({ example: 'https://picsum.photos/seed/room/1200/800' })
  @IsUrl({ require_tld: false })
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  displayOrder?: number;
}

export class CreatePortfolioDto {
  @ApiProperty({ example: 'Scandinavian Living Room' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'Scandinavian' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  style!: string;

  @ApiProperty({ example: 'Living Room' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  roomType!: string;

  @ApiPropertyOptional({ example: 450000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [CreatePortfolioImageDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePortfolioImageDto)
  images?: CreatePortfolioImageDto[];
}
