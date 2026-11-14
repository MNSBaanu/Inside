-- AlterTable
ALTER TABLE "Moodboard" ADD COLUMN     "moodWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "palette" TEXT[] DEFAULT ARRAY[]::TEXT[];
