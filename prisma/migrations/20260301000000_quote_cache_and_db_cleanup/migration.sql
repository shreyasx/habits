-- DropIndex
DROP INDEX "Habit_userId_idx";

-- DropIndex
DROP INDEX "HabitCompletion_habitId_date_idx";

-- DropIndex
DROP INDEX "HabitCompletion_habitId_userId_date_idx";

-- DropIndex
DROP INDEX "HabitCompletion_habitId_userId_idx";

-- DropIndex
DROP INDEX "HabitCompletion_userId_date_idx";

-- AlterTable
ALTER TABLE "HabitCompletion" ALTER COLUMN "date" SET DATA TYPE DATE;

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quote_fetchedAt_idx" ON "Quote"("fetchedAt");

-- Deduplicate before adding unique constraint (keep latest record per group)
DELETE FROM "HabitCompletion" a
USING "HabitCompletion" b
WHERE a.id < b.id
  AND a."habitId" = b."habitId"
  AND a."userId" = b."userId"
  AND a.date = b.date;

-- CreateIndex
CREATE UNIQUE INDEX "HabitCompletion_habitId_userId_date_key" ON "HabitCompletion"("habitId", "userId", "date");
