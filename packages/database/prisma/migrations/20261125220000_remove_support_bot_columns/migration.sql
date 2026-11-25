-- Inside Bot moved out of the support chat; undo 20261125210000_add_inside_bot.
DELETE FROM "SupportMessage" WHERE "senderId" IS NULL;

-- AlterTable
ALTER TABLE "SupportMessage" DROP COLUMN "fromBot",
ALTER COLUMN "senderId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "supportHumanAt";
