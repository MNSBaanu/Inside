import { createHash } from 'crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
};

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  sign(folder: UploadFolder) {
    const { cloudName, apiKey, apiSecret } = this.credentials();
    const timestamp = Math.floor(Date.now() / 1000);
    const namespaced = `inside/${folder}`;

    const signature = createHash('sha1')
      .update(`folder=${namespaced}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    return {
      success: true,
      data: {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder: namespaced,
        resourceType: resourceTypes[folder],
      },
    };
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
