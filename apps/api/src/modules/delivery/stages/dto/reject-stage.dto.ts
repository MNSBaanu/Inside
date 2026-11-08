import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectStageDto {
  @ApiProperty({ description: 'Feedback shared with the designer' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  reason!: string;
}
