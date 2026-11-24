import { api } from './client';

export type UploadFolder =
  | 'portfolios'
  | 'moodboards'
  | 'deliverables'
  | 'attachments'
  | 'avatars'
  | 'products';

type SignedUpload = {
  cloudName: string;
  resourceType: 'image' | 'auto';
  params: Record<string, string>;
};

export type UploadedFile = { url: string; fileName: string };

/** Uploads to Cloudinary. `onProgress` gets the share sent so far, from 0 to 1. */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  onProgress?: (fraction: number) => void,
): Promise<UploadedFile> {
  const signed = await api.post<SignedUpload>('/uploads/signature', { folder });

  const form = new FormData();
  form.append('file', file);
  for (const [key, value] of Object.entries(signed.params)) {
    form.append(key, value);
  }

  const { ok, payload } = await new Promise<{
    ok: boolean;
    payload: { secure_url?: string; error?: { message?: string } } | null;
  }>((resolve) => {
    const request = new XMLHttpRequest();
    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`,
    );
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () => {
      let body = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        body = null;
      }
      resolve({ ok: request.status >= 200 && request.status < 300, payload: body });
    };
    request.onerror = () => resolve({ ok: false, payload: null });
    request.send(form);
  });

  if (!ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message ?? 'The upload failed.');
  }

  onProgress?.(1);
  return { url: payload.secure_url, fileName: file.name };
}
