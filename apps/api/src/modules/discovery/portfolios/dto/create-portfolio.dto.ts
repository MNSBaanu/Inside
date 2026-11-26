import { AddPortfolioImageDto } from './add-portfolio-image.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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

  @ApiPropertyOptional({
    description: 'Completed project the client approved for this portfolio',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ type: [AddPortfolioImageDto] })
  @IsOptional()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => AddPortfolioImageDto)
  images?: AddPortfolioImageDto[];
}
