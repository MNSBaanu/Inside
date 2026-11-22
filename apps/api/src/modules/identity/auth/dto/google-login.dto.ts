import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google OAuth access token (openid email profile)',
  })
  @IsString()
  @MinLength(20)
  accessToken!: string;

  @ApiPropertyOptional({ enum: ['CLIENT', 'DESIGNER'], default: 'CLIENT' })
  @IsOptional()
  @IsIn(['CLIENT', 'DESIGNER'])
  role?: 'CLIENT' | 'DESIGNER';
}
