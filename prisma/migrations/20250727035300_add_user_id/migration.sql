/*
  Warnings:

  - Added the required column `userId` to the `Habit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `HabitCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- Add userId column with default value first
ALTER TABLE "Habit" ADD COLUMN "userId" TEXT DEFAULT 'default-user';
ALTER TABLE "HabitCompletion" ADD COLUMN "userId" TEXT DEFAULT 'default-user';

-- Update existing records to use default user ID
UPDATE "Habit" SET "userId" = 'default-user' WHERE "userId" IS NULL;
UPDATE "HabitCompletion" SET "userId" = 'default-user' WHERE "userId" IS NULL;

-- Make userId required by removing default
ALTER TABLE "Habit" ALTER COLUMN "userId" DROP DEFAULT;
ALTER TABLE "HabitCompletion" ALTER COLUMN "userId" DROP DEFAULT;

-- Make columns NOT NULL
ALTER TABLE "Habit" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "HabitCompletion" ALTER COLUMN "userId" SET NOT NULL;
