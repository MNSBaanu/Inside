import { IsCloudinaryUrl } from '../../../../common/cloudinary-url';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDeliverableDto {
  @ApiProperty({ example: 'https://cdn.example.com/proposal-v1.pdf' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsCloudinaryUrl()
  @MaxLength(2000)
  fileUrl!: string;

  @ApiPropertyOptional({ example: 'proposal-v1.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ description: 'SHA-256 of the uploaded file' })
  @IsOptional()
  @Matches(/^[a-f0-9]{64}$/)
  fileHash?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: 'site_photos',
    description: 'Stage requirement this file fills',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  requirement?: string;
}

export class UpdateDeliverableFeedbackDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  feedback!: string;
}
