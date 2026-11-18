import { Matches } from 'class-validator';

export const IsCloudinaryUrl = () =>
  Matches(/^https:\/\/res\.cloudinary\.com\//, {
    message: '$property must be a file uploaded through the platform',
  });
