import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectStageDto {
  @ApiPropertyOptional({ description: 'Reason shared with the designer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
