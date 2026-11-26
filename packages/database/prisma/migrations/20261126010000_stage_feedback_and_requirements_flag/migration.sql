-- AlterTable
ALTER TABLE "ProjectStage" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "requirementsApply" BOOLEAN NOT NULL DEFAULT true;

-- Stages that existed before stage requirements keep the old submit rule
UPDATE "ProjectStage" SET "requirementsApply" = false;
