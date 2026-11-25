-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN "fromBot" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "senderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "supportHumanAt" TIMESTAMP(3);
