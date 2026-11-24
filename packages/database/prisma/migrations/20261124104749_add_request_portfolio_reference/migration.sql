-- AlterTable
ALTER TABLE "ProjectRequest" ADD COLUMN     "portfolioId" TEXT;

-- CreateIndex
CREATE INDEX "ProjectRequest_portfolioId_idx" ON "ProjectRequest"("portfolioId");

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
