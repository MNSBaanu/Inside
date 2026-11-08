import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateFavouriteDto {
  @ApiProperty({ description: 'Designer user id to favourite' })
  @IsUUID()
  designerId!: string;
}
