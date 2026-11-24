import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AnswerPortfolioShareDto {
  @ApiProperty()
  @IsBoolean()
  approve!: boolean;
}
