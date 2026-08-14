import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, ValidateIf } from 'class-validator';

export class UpdateStageDueDateDto {
  @ApiPropertyOptional({
    description: 'Due date for the stage (ISO). Null clears it.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  dueDate?: Date | null;
}
