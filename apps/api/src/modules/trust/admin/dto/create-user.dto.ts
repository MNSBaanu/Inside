import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { RegisterDto } from '../../../identity/auth/dto/register.dto';

export class AdminCreateUserDto extends PickType(RegisterDto, [
  'email',
  'password',
  'name',
] as const) {
  @ApiProperty({ enum: ['CLIENT', 'DESIGNER'] })
  @IsIn(['CLIENT', 'DESIGNER'])
  role!: 'CLIENT' | 'DESIGNER';
}
