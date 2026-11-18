import { IsCloudinaryUrl } from '../../../../common/cloudinary-url';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class AddPortfolioImageDto {
  @ApiProperty({ example: 'https://picsum.photos/seed/detail/1200/800' })
  @IsUrl({ require_tld: false })
  @IsCloudinaryUrl()
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
