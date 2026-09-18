-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3);

-- Existing isVerified values may have come from email verification.
UPDATE "User" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "isVerified" = true;

-- The verified badge now requires an approved designer verification.
UPDATE "User" u SET "isVerified" = false
WHERE u."isVerified" = true
  AND NOT EXISTS (
    SELECT 1 FROM "Verification" v
    WHERE v."designerId" = u."id" AND v."status" = 'APPROVED'
  );
