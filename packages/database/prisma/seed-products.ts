import { PrismaClient } from '@prisma/client';
import { cloudinaryCredentials, loadEnvFiles, migrateImages } from './cloudinary-images';
import { PRODUCT_SEED } from './products';

// Adds or refreshes the sample shop products without touching any other data.
const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to write sample products to a production database.');
  }
  for (const { id, ...data } of PRODUCT_SEED) {
    await prisma.product.upsert({
      where: { id: id as string },
      create: { id: id as string, ...data },
      update: data,
    });
  }
  loadEnvFiles();
  if (cloudinaryCredentials()) {
    const images = await migrateImages(prisma, { apply: true });
    console.log(`Images copied to Cloudinary: ${images.uploaded}, failed: ${images.failed.length}`);
  }
  console.log(`Sample products ready: ${PRODUCT_SEED.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
