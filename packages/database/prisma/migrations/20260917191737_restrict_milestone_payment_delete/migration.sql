-- DropForeignKey
ALTER TABLE "MilestonePayment" DROP CONSTRAINT "MilestonePayment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "MilestonePayment" DROP CONSTRAINT "MilestonePayment_stageId_fkey";

-- AddForeignKey
ALTER TABLE "MilestonePayment" ADD CONSTRAINT "MilestonePayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestonePayment" ADD CONSTRAINT "MilestonePayment_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
