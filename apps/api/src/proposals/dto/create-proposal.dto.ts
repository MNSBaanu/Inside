import { ApiProperty } from '@nestjs/swagger';
import { StageName } from '@inside/database';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class StageFeeDto {
  @ApiProperty({ enum: StageName })
  @IsEnum(StageName)
  name!: StageName;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
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
  @ValidateNested({ each: true })
  @Type(() => StageFeeDto)
  stageFees!: StageFeeDto[];
}
