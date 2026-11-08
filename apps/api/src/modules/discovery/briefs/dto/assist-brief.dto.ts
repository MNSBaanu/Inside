import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AssistBriefDto {
  @ApiProperty({
    example: 'We want a calm living room, keeping our teak cabinet.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(1500)
  text!: string;
}
