import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BotTurnDto {
  @ApiProperty({ enum: ['user', 'bot'] })
  @IsIn(['user', 'bot'])
  role!: 'user' | 'bot';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}

export class AskBotDto {
  @ApiProperty({ type: [BotTurnDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BotTurnDto)
  turns!: BotTurnDto[];
}
