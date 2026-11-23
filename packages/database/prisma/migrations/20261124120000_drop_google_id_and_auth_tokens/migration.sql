-- DropForeignKey
ALTER TABLE "AuthToken" DROP CONSTRAINT "AuthToken_userId_fkey";

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleId";

-- DropTable
DROP TABLE "AuthToken";

-- DropEnum
DROP TYPE "AuthTokenType";
