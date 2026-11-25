-- CreateEnum
CREATE TYPE "WorkLogType" AS ENUM ('SITE_VISIT', 'MEASUREMENT', 'MEETING', 'ORDER', 'DELIVERY', 'INSTALLATION', 'PROGRESS', 'ISSUE');

-- AlterTable
ALTER TABLE "Deliverable" ADD COLUMN     "requirement" TEXT;

-- CreateTable
CREATE TABLE "StageNote" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "authorId" TEXT NOT NULL,
    "type" "WorkLogType" NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StageNote_stageId_key_key" ON "StageNote"("stageId", "key");

-- CreateIndex
CREATE INDEX "WorkLog_projectId_happenedAt_idx" ON "WorkLog"("projectId", "happenedAt");

-- CreateIndex
CREATE INDEX "WorkLog_stageId_idx" ON "WorkLog"("stageId");

-- AddForeignKey
ALTER TABLE "StageNote" ADD CONSTRAINT "StageNote_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
