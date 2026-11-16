-- AlterTable
ALTER TABLE "User" ADD COLUMN "hasClientAccount" BOOLEAN NOT NULL DEFAULT false;

-- Designers who already use client features keep their client account
UPDATE "User" u
SET "hasClientAccount" = true
WHERE u."role" = 'DESIGNER'
  AND (
    u."activeRole" = 'CLIENT'
    OR EXISTS (SELECT 1 FROM "Brief" b WHERE b."clientId" = u."id")
    OR EXISTS (SELECT 1 FROM "Moodboard" m WHERE m."clientId" = u."id")
    OR EXISTS (SELECT 1 FROM "Favourite" f WHERE f."clientId" = u."id")
    OR EXISTS (SELECT 1 FROM "ProjectRequest" r WHERE r."clientId" = u."id")
    OR EXISTS (SELECT 1 FROM "Project" p WHERE p."clientId" = u."id")
  );
