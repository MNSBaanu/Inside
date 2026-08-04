import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeliverableDto {
  @ApiProperty({ example: 'https://cdn.example.com/proposal-v1.pdf' })
  @IsString()
  @MaxLength(2000)
  fileUrl!: string;

  @ApiPropertyOptional({ example: 'proposal-v1.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateDeliverableFeedbackDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  feedback!: string;
}
