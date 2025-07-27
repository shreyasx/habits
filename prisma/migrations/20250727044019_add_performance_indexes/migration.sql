-- CreateIndex
CREATE INDEX "Habit_userId_sortOrder_idx" ON "Habit"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

-- CreateIndex
CREATE INDEX "HabitCompletion_habitId_userId_date_idx" ON "HabitCompletion"("habitId", "userId", "date");

-- CreateIndex
CREATE INDEX "HabitCompletion_habitId_date_idx" ON "HabitCompletion"("habitId", "date");

-- CreateIndex
CREATE INDEX "HabitCompletion_userId_date_idx" ON "HabitCompletion"("userId", "date");

-- CreateIndex
CREATE INDEX "HabitCompletion_habitId_userId_idx" ON "HabitCompletion"("habitId", "userId");
