import { createHash } from 'crypto';
import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { UploadFolder } from './dto/sign-upload.dto';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  function serviceWith(values: Record<string, string | undefined>) {
    const config = {
      get: (key: string) => values[key],
    } as unknown as ConfigService;
    return new UploadsService(config);
  }

  it('parses CLOUDINARY_URL and signs every upload parameter', () => {
    const service = serviceWith({
      CLOUDINARY_URL: 'cloudinary://key123:secret456@inside-demo',
    });

    const { data } = service.sign(designer, UploadFolder.PORTFOLIOS);

    expect(data.cloudName).toBe('inside-demo');
    expect(data.resourceType).toBe('image');
    expect(data.params.api_key).toBe('key123');
    expect(data.params.folder).toBe('inside/portfolios');
    expect(data.params.tags).toBe('user_d1');
    expect(data.params.allowed_formats).not.toContain('svg');

    const expected = createHash('sha1')
      .update(
        `allowed_formats=${data.params.allowed_formats}&folder=inside/portfolios&tags=user_d1&timestamp=${data.params.timestamp}secret456`,
      )
      .digest('hex');
    expect(data.params.signature).toBe(expected);
  });

  it('uses resource type auto for deliverables so PDFs are accepted', () => {
    const service = serviceWith({
      CLOUDINARY_URL: 'cloudinary://key123:secret456@inside-demo',
    });

    const { data } = service.sign(designer, UploadFolder.DELIVERABLES);
    expect(data.resourceType).toBe('auto');
    expect(data.params.allowed_formats).toContain('pdf');
  });

  it('falls back to discrete credential variables', () => {
    const service = serviceWith({
      CLOUDINARY_CLOUD_NAME: 'inside-demo',
      CLOUDINARY_API_KEY: 'key123',
      CLOUDINARY_API_SECRET: 'secret456',
    });

    expect(service.sign(client, UploadFolder.MOODBOARDS).data.cloudName).toBe(
      'inside-demo',
    );
  });

  it('only lets designers upload portfolio images and deliverables', () => {
    const service = serviceWith({
      CLOUDINARY_URL: 'cloudinary://key123:secret456@inside-demo',
    });

    expect(() => service.sign(client, UploadFolder.PORTFOLIOS)).toThrow(
      ForbiddenException,
    );
    expect(() => service.sign(client, UploadFolder.DELIVERABLES)).toThrow(
      ForbiddenException,
    );
    expect(() => service.sign(designer, UploadFolder.MOODBOARDS)).toThrow(
      ForbiddenException,
    );
  });

  it('reports a clear error when nothing is configured', () => {
    const service = serviceWith({});

    expect(() => service.sign(designer, UploadFolder.PORTFOLIOS)).toThrow(
      ServiceUnavailableException,
    );
  });
});
