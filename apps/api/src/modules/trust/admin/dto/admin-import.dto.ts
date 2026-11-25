import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  IsEmail,
  IsIn,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const IMPORT_MAX_ROWS = 500;

export class ImportRowsDto {
  @ApiProperty({ description: 'Rows parsed from the uploaded CSV file' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(IMPORT_MAX_ROWS)
  @IsObject({ each: true })
  rows!: Record<string, unknown>[];
}

export class ImportUserRowDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsIn(['CLIENT', 'DESIGNER'])
  role!: 'CLIENT' | 'DESIGNER';
}

export class ImportSubscriberRowDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
