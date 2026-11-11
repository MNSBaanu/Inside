import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum UploadFolder {
  PORTFOLIOS = 'portfolios',
  MOODBOARDS = 'moodboards',
  DELIVERABLES = 'deliverables',
  ATTACHMENTS = 'attachments',
  AVATARS = 'avatars',
}

export class SignUploadDto {
  @ApiProperty({ enum: UploadFolder })
  @IsEnum(UploadFolder)
  folder!: UploadFolder;
}
