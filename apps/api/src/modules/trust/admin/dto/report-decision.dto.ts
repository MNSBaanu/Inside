import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportDecisionDto {
  @ApiPropertyOptional({ example: 'Portfolio removed for copied images.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    description:
      'Resolve only: unpublish the portfolio, hide the message or review, or suspend the user',
  })
  @IsOptional()
  @IsBoolean()
  removeContent?: boolean;
}
