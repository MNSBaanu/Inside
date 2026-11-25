import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminInviteDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class AcceptAdminInviteDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;
}
