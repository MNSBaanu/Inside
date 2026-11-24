-- CreateEnum
CREATE TYPE "PortfolioShareStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "portfolioShare" "PortfolioShareStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_projectId_key" ON "Portfolio"("projectId");

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
