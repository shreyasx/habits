import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfDay, subDays } from "date-fns";

interface HabitCompletion {
	id: string;
	habitId: string;
	date: Date;
	completed: boolean;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Extract YYYY-MM-DD from a Date using the user's local timezone.
 * Use this for grid/UI dates that originate on the client.
 */
export function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * Get the current date considering 4am as the day transition point
 * If it's before 4am, show yesterday's date
 * If it's after 4am, show today's date
 */
export function getCurrentDate(): Date {
	const now = new Date();
	const currentHour = now.getHours();

	// If it's before 4am, consider it still the previous day
	if (currentHour < 4) {
		return startOfDay(subDays(now, 1));
	}

	return startOfDay(now);
}

/**
 * Calculate streak considering previous days' completions
 * A streak is active if the habit was completed yesterday and the day before
 */
export function calculateStreak(
	completions: HabitCompletion[],
	currentDate: Date
): number {
	let streak = 0;
	let checkDate = startOfDay(currentDate);

	function isCompletedOn(d: Date): boolean {
		const ds = toDateString(d);
		return completions?.some(
			(c: HabitCompletion) =>
				c.date.toISOString().split("T")[0] === ds && c.completed
		);
	}

	// If today is completed, count from today; otherwise start from yesterday
	if (!isCompletedOn(checkDate)) {
		checkDate = subDays(checkDate, 1);
	}

	while (isCompletedOn(checkDate)) {
		streak++;
		checkDate = subDays(checkDate, 1);
	}

	return streak;
}

/**
 * Check if a streak should be considered active
 * A streak is active if the habit was completed yesterday and the day before
 * OR if the habit was completed yesterday and today (2 consecutive days)
 */
export function isStreakActive(
	completions: HabitCompletion[],
	currentDate: Date
): boolean {
	const today = startOfDay(currentDate);
	const yesterday = subDays(today, 1);
	const dayBeforeYesterday = subDays(today, 2);

	function isCompletedOn(d: Date): boolean {
		const ds = toDateString(d);
		return completions?.some(
			(c: HabitCompletion) =>
				c.date.toISOString().split("T")[0] === ds && c.completed
		);
	}

	// Streak is active if:
	// 1. Yesterday AND day before yesterday were completed
	// 2. OR today AND yesterday were completed (2 consecutive days)
	return (
		(isCompletedOn(yesterday) && isCompletedOn(dayBeforeYesterday)) ||
		(isCompletedOn(today) && isCompletedOn(yesterday))
	);
}
