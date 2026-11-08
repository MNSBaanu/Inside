import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelProjectDto {
  @ApiProperty({ description: 'Why the project is being cancelled' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  reason!: string;
}
