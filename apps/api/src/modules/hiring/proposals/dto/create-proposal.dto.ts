import { ApiProperty } from '@nestjs/swagger';
import { StageName } from '@inside/database';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_AMOUNT } from '../../../../common/money';

export class StageFeeDto {
  @ApiProperty({ enum: StageName })
  @IsEnum(StageName)
  name!: StageName;

  @ApiProperty({ example: 100000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_AMOUNT)
  fee!: number;
}

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  scope!: string;

  @ApiProperty({ example: '6 weeks' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  timeline!: string;

  @ApiProperty({ type: [StageFeeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StageFeeDto)
  stageFees!: StageFeeDto[];
}
