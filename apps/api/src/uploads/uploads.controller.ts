import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SignUploadDto } from './dto/sign-upload.dto';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('signature')
  @ApiOperation({ summary: 'Sign a direct browser upload to Cloudinary' })
  @ApiOkResponse({ description: 'Signed upload parameters' })
  sign(@Body() dto: SignUploadDto) {
    return this.uploads.sign(dto.folder);
  }
}
