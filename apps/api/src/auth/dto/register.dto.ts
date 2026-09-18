import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'newuser@inside.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Alex User' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ enum: ['CLIENT', 'DESIGNER'], default: 'CLIENT' })
  @IsOptional()
  @IsIn(['CLIENT', 'DESIGNER'])
  role?: 'CLIENT' | 'DESIGNER';
}
