import * as DocumentPicker from 'expo-document-picker';
import { api } from './api';

export type UploadFolder = 'deliverables' | 'attachments';

type SignedUpload = {
  cloudName: string;
  resourceType: 'image' | 'auto';
  params: Record<string, string>;
};

export type UploadedFile = { url: string; fileName: string };

/** Lets the user pick a file and uploads it straight to Cloudinary. Null if cancelled. */
export async function pickAndUpload(
  folder: UploadFolder,
): Promise<UploadedFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
  });
  if (picked.canceled) return null;
  const file = picked.assets[0];

  const signed = await api.post<SignedUpload>('/uploads/signature', { folder });

  const form = new FormData();
  // React Native's FormData takes a { uri, name, type } descriptor for files.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);
  for (const [key, value] of Object.entries(signed.params)) {
    form.append(key, value);
  }

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
