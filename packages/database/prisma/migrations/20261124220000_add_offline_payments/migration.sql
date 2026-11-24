-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "MilestonePayment" ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'CARD',
ADD COLUMN     "proofUrl" TEXT,
ADD COLUMN     "recordedById" TEXT,
ADD COLUMN     "reference" TEXT;

