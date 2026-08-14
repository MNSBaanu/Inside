import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetReviewVisibilityDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isVisible!: boolean;
}
