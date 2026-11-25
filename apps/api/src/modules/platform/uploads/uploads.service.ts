import { createHash } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { UploadFolder } from './dto/sign-upload.dto';

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

const resourceTypes: Record<UploadFolder, 'image' | 'auto'> = {
  [UploadFolder.PORTFOLIOS]: 'image',
  [UploadFolder.MOODBOARDS]: 'image',
  [UploadFolder.DELIVERABLES]: 'auto',
  [UploadFolder.ATTACHMENTS]: 'auto',
  [UploadFolder.AVATARS]: 'image',
  [UploadFolder.PRODUCTS]: 'image',
};

const IMAGE_FORMATS = 'jpg,jpeg,png,webp,gif,avif,heic';

const allowedFormats: Record<UploadFolder, string> = {
  [UploadFolder.PORTFOLIOS]: IMAGE_FORMATS,
  [UploadFolder.MOODBOARDS]: IMAGE_FORMATS,
  [UploadFolder.DELIVERABLES]: `${IMAGE_FORMATS},pdf,dwg,dxf,zip`,
  [UploadFolder.ATTACHMENTS]: `${IMAGE_FORMATS},pdf,doc,docx,xls,xlsx,zip`,
  [UploadFolder.AVATARS]: IMAGE_FORMATS,
  [UploadFolder.PRODUCTS]: IMAGE_FORMATS,
};

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  sign(user: AuthUser, folder: UploadFolder) {
    this.assertCanUpload(user, folder);
    const { cloudName, apiKey, apiSecret } = this.credentials();

    // Cloudinary signs every upload parameter, sorted by name.
    const signed = {
      allowed_formats: allowedFormats[folder],
      folder: `inside/${folder}`,
      tags: `user_${user.id}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const signature = createHash('sha1')
      .update(
        Object.entries(signed)
          .map(([key, value]) => `${key}=${value}`)
          .join('&') + apiSecret,
      )
      .digest('hex');

    return {
      success: true,
      data: {
        cloudName,
        resourceType: resourceTypes[folder],
        params: { ...signed, api_key: apiKey, signature },
      },
    };
  }

  private assertCanUpload(user: AuthUser, folder: UploadFolder) {
    const designer =
      user.role === Role.DESIGNER && user.activeRole === Role.DESIGNER;
    const allowed = {
      [UploadFolder.PORTFOLIOS]: designer,
      [UploadFolder.DELIVERABLES]: designer,
      [UploadFolder.MOODBOARDS]:
        user.role !== Role.ADMIN && user.activeRole === Role.CLIENT,
      [UploadFolder.ATTACHMENTS]: true,
      [UploadFolder.AVATARS]: true,
      [UploadFolder.PRODUCTS]: user.role === Role.ADMIN,
    }[folder];
    if (!allowed) {
      throw new ForbiddenException(
        `Your current role cannot upload to ${folder}`,
      );
    }
  }

  private credentials(): CloudinaryCredentials {
    const url = this.config.get<string>('CLOUDINARY_URL');
    const parsed = url ? this.parseUrl(url) : null;

    const cloudName =
      parsed?.cloudName ?? this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey =
      parsed?.apiKey ?? this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret =
      parsed?.apiSecret ?? this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Uploads are not configured. Set CLOUDINARY_URL on the API.',
      );
    }

    return { cloudName, apiKey, apiSecret };
  }

  private parseUrl(url: string): CloudinaryCredentials | null {
    const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (!match) return null;
    return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
  }
}
