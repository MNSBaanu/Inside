import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PrismaClient } from '@prisma/client';

type Credentials = { cloudName: string; apiKey: string; apiSecret: string };
type Target = { table: string; url: string; folder: string };
type Report = {
  found: Record<string, number>;
  unique: number;
  uploaded: number;
  failed: { url: string; reason: string }[];
  mapFile?: string;
};

export function loadEnvFiles() {
  for (const file of ['../.env', '../../../apps/api/.env']) {
    const path = resolve(__dirname, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

export function cloudinaryCredentials(): Credentials | null {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(
    (process.env.CLOUDINARY_URL ?? '').trim(),
  );
  return match ? { apiKey: match[1], apiSecret: match[2], cloudName: match[3] } : null;
}

const isExternal = (url: string | null | undefined): url is string => {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  return !/^https?:\/\/res\.cloudinary\.com\//i.test(url);
};

const isUnsplash = (url: string | null | undefined): url is string =>
  !!url && /^https?:\/\/images\.unsplash\.com\//i.test(url);

async function uploadFromUrl(url: string, folder: string, creds: Credentials) {
  const params: Record<string, string> = {
    folder: `inside/${folder}`,
    overwrite: 'false',
    public_id: createHash('sha1').update(url).digest('hex').slice(0, 20),
    timestamp: String(Math.floor(Date.now() / 1000)),
    unique_filename: 'false',
  };
  const signature = createHash('sha1')
    .update(
      Object.entries(params)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([key, value]) => `${key}=${value}`)
        .join('&') + creds.apiSecret,
    )
    .digest('hex');

  const form = new FormData();
  form.append('file', url);
  form.append('api_key', creds.apiKey);
  form.append('signature', signature);
  for (const [key, value] of Object.entries(params)) form.append(key, value);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  const payload = (await response.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;
  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message ?? `HTTP ${response.status}`);
  }
  return payload.secure_url;
}

type SavedItem = { imageUrl?: string; [key: string]: unknown };

export async function migrateImages(
  prisma: PrismaClient,
  options: { apply: boolean; log?: (message: string) => void },
): Promise<Report> {
  const log = options.log ?? (() => undefined);
  const targets: Target[] = [];

  for (const row of await prisma.product.findMany({ select: { imageUrl: true } })) {
    if (isExternal(row.imageUrl)) targets.push({ table: 'Product', url: row.imageUrl, folder: 'products' });
  }
  for (const row of await prisma.portfolioImage.findMany({ select: { imageUrl: true } })) {
    if (isExternal(row.imageUrl)) targets.push({ table: 'PortfolioImage', url: row.imageUrl, folder: 'portfolios' });
  }
  for (const row of await prisma.user.findMany({ where: { avatarUrl: { not: null } }, select: { avatarUrl: true } })) {
    if (isExternal(row.avatarUrl)) targets.push({ table: 'User.avatarUrl', url: row.avatarUrl, folder: 'avatars' });
  }
  for (const row of await prisma.deliverable.findMany({ select: { fileUrl: true } })) {
    if (isUnsplash(row.fileUrl)) targets.push({ table: 'Deliverable', url: row.fileUrl, folder: 'deliverables' });
  }
  for (const row of await prisma.message.findMany({ where: { attachmentUrl: { not: null } }, select: { attachmentUrl: true } })) {
    if (isUnsplash(row.attachmentUrl)) targets.push({ table: 'Message', url: row.attachmentUrl, folder: 'attachments' });
  }
  const boards = await prisma.moodboard.findMany({ select: { id: true, savedItems: true } });
  for (const board of boards) {
    for (const item of (board.savedItems as SavedItem[] | null) ?? []) {
      if (isExternal(item.imageUrl)) targets.push({ table: 'Moodboard', url: item.imageUrl, folder: 'moodboards' });
    }
  }

  const found: Record<string, number> = {};
  for (const target of targets) found[target.table] = (found[target.table] ?? 0) + 1;
  const firstFolder = new Map<string, string>();
  for (const target of targets) if (!firstFolder.has(target.url)) firstFolder.set(target.url, target.folder);

  const report: Report = { found, unique: firstFolder.size, uploaded: 0, failed: [] };
  if (!options.apply || firstFolder.size === 0) return report;

  const creds = cloudinaryCredentials();
  if (!creds) throw new Error('CLOUDINARY_URL is not set.');

  const mapping: Record<string, string> = {};
  for (const [url, folder] of firstFolder) {
    try {
      mapping[url] = await uploadFromUrl(url, folder, creds);
      report.uploaded += 1;
      log(`uploaded ${report.uploaded}/${firstFolder.size}`);
    } catch (error) {
      report.failed.push({ url, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  for (const [from, to] of Object.entries(mapping)) {
    await prisma.product.updateMany({ where: { imageUrl: from }, data: { imageUrl: to } });
    await prisma.portfolioImage.updateMany({ where: { imageUrl: from }, data: { imageUrl: to } });
    await prisma.user.updateMany({ where: { avatarUrl: from }, data: { avatarUrl: to } });
    await prisma.deliverable.updateMany({ where: { fileUrl: from }, data: { fileUrl: to } });
    await prisma.message.updateMany({ where: { attachmentUrl: from }, data: { attachmentUrl: to } });
  }
  for (const board of boards) {
    const items = (board.savedItems as SavedItem[] | null) ?? [];
    if (!items.some((item) => item.imageUrl && mapping[item.imageUrl])) continue;
    await prisma.moodboard.update({
      where: { id: board.id },
      data: {
        savedItems: items.map((item) =>
          item.imageUrl && mapping[item.imageUrl] ? { ...item, imageUrl: mapping[item.imageUrl] } : item,
        ) as object[],
      },
    });
  }

  if (Object.keys(mapping).length > 0) {
    report.mapFile = resolve(__dirname, `image-migration-${Date.now()}.json`);
    writeFileSync(report.mapFile, JSON.stringify(mapping, null, 2));
  }
  return report;
}
