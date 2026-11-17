import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ContactStatus, ContactTopic } from '@inside/database';
import { AdminSearchQueryDto } from '../../../trust/admin/dto/admin-list-query.dto';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Alex Perera' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ enum: ContactTopic })
  @IsIn(Object.values(ContactTopic))
  topic!: ContactTopic;

  @ApiProperty({ example: 'I would like to know more about…' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}

export class AdminContactQueryDto extends AdminSearchQueryDto {
  @ApiPropertyOptional({ enum: ContactStatus })
  @IsOptional()
  @IsIn(Object.values(ContactStatus))
  status?: ContactStatus;

  @ApiPropertyOptional({ enum: ContactTopic })
  @IsOptional()
  @IsIn(Object.values(ContactTopic))
  topic?: ContactTopic;
}

export class SetContactStatusDto {
  @ApiProperty({ enum: ContactStatus })
  @IsIn(Object.values(ContactStatus))
  status!: ContactStatus;
}
