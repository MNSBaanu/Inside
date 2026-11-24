import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewMoodboardDto {
  @ApiProperty({
    description: 'true approves the moodboard, false asks for changes',
  })
  @IsBoolean()
  approve!: boolean;

  @ApiPropertyOptional({ example: 'Could you add a few lighting ideas?' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
