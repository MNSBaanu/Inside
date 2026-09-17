import { createHash } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { UploadFolder } from './dto/sign-upload.dto';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  function serviceWith(values: Record<string, string | undefined>) {
    const config = {
      get: (key: string) => values[key],
    } as unknown as ConfigService;
    return new UploadsService(config);
  }

  it('parses CLOUDINARY_URL and signs folder and timestamp', () => {
    const service = serviceWith({
      CLOUDINARY_URL: 'cloudinary://key123:secret456@inside-demo',
    });

    const { data } = service.sign(UploadFolder.PORTFOLIOS);

    expect(data.cloudName).toBe('inside-demo');
    expect(data.apiKey).toBe('key123');
    expect(data.folder).toBe('inside/portfolios');
    expect(data.resourceType).toBe('image');

    const expected = createHash('sha1')
      .update(`folder=inside/portfolios&timestamp=${data.timestamp}secret456`)
      .digest('hex');
    expect(data.signature).toBe(expected);
  });

  it('uses resource type auto for deliverables so PDFs are accepted', () => {
    const service = serviceWith({
      CLOUDINARY_URL: 'cloudinary://key123:secret456@inside-demo',
    });

    expect(service.sign(UploadFolder.DELIVERABLES).data.resourceType).toBe(
      'auto',
    );
  });

  it('falls back to discrete credential variables', () => {
    const service = serviceWith({
      CLOUDINARY_CLOUD_NAME: 'inside-demo',
      CLOUDINARY_API_KEY: 'key123',
      CLOUDINARY_API_SECRET: 'secret456',
    });

    expect(service.sign(UploadFolder.MOODBOARDS).data.cloudName).toBe(
      'inside-demo',
    );
  });

  it('reports a clear error when nothing is configured', () => {
    const service = serviceWith({});

    expect(() => service.sign(UploadFolder.PORTFOLIOS)).toThrow(
      ServiceUnavailableException,
    );
  });
});
