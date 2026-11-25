import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SaveStageNoteDto {
  @ApiProperty({ description: 'Text for a stage requirement; empty clears it' })
  @IsString()
  @MaxLength(5000)
  text!: string;
}
