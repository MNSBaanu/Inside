import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePortfolioDto } from './create-portfolio.dto';

export class UpdatePortfolioDto extends PartialType(
  OmitType(CreatePortfolioDto, ['images'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
