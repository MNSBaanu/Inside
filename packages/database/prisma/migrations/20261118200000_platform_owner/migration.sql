-- AlterTable
ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- The earliest admin becomes the platform owner.
UPDATE "User" SET "isOwner" = true
WHERE "id" = (
  SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC, "id" ASC LIMIT 1
);
