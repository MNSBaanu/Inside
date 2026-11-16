-- AlterTable
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;

-- Backfill readable slugs from product names, suffixing duplicates with part of the id
UPDATE "Product"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

UPDATE "Product" p
SET "slug" = p."slug" || '-' || left(p."id", 8)
WHERE EXISTS (
  SELECT 1 FROM "Product" o
  WHERE o."slug" = p."slug" AND o."id" < p."id"
);

ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
