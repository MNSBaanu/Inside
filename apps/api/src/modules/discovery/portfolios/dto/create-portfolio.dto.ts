import { AddPortfolioImageDto } from './add-portfolio-image.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_AMOUNT } from '../../../../common/money';

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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_AMOUNT)
  budget?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [AddPortfolioImageDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddPortfolioImageDto)
  images?: AddPortfolioImageDto[];
}
