import { PrismaClient } from '@prisma/client';
import { loadEnvFiles, migrateImages } from './cloudinary-images';

loadEnvFiles();

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  const host = /@([^/:?]+)/.exec(process.env.DATABASE_URL ?? '')?.[1] ?? 'unknown';
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} against database host: ${host}`);
  const report = await migrateImages(prisma, { apply, log: console.log });
  console.log('External images found:', report.found);
  console.log(`Unique images: ${report.unique}, uploaded: ${report.uploaded}, failed: ${report.failed.length}`);
  for (const failure of report.failed) console.log(`FAILED ${failure.url} -> ${failure.reason}`);
  if (report.mapFile) console.log(`Old -> new links saved to ${report.mapFile}`);
  if (!apply) console.log('Nothing changed. Re-run with --apply to upload and update the database.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
