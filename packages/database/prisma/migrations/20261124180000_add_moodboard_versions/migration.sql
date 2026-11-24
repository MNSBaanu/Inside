-- CreateEnum
CREATE TYPE "MoodboardStatus" AS ENUM ('OPEN', 'APPROVED', 'CHANGES_REQUESTED');

-- AlterTable
ALTER TABLE "Moodboard" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewRequestId" TEXT,
ADD COLUMN     "status" "MoodboardStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Moodboard_parentId_idx" ON "Moodboard"("parentId");

-- AddForeignKey
ALTER TABLE "Moodboard" ADD CONSTRAINT "Moodboard_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Moodboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

