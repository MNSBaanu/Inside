import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'What needs doing' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;
}

export class UpdateTaskDto {
  @ApiProperty()
  @IsBoolean()
  isDone!: boolean;
}
