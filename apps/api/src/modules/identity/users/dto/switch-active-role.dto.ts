import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SwitchActiveRoleDto {
  @ApiProperty({ enum: ['CLIENT', 'DESIGNER'] })
  @IsIn(['CLIENT', 'DESIGNER'])
  activeRole!: 'CLIENT' | 'DESIGNER';
}
