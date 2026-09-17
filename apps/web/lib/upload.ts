import { api } from './api';

export type UploadFolder = 'portfolios' | 'moodboards' | 'deliverables';

type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: 'image' | 'auto';
};

export type UploadedFile = { url: string; fileName: string };

export async function uploadFile(
  file: File,
  folder: UploadFolder,
): Promise<UploadedFile> {
  const signed = await api.post<SignedUpload>('/uploads/signature', { folder });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  form.append('folder', signed.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`,
    { method: 'POST', body: form },
  );

  const payload = (await response.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message ?? 'The upload failed.');
  }

  return { url: payload.secure_url, fileName: file.name };
}
