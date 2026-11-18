import { IsCloudinaryUrl } from '../../../../common/cloudinary-url';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsCloudinaryUrl()
  @MaxLength(2000)
  attachmentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  attachmentType?: string;
}
