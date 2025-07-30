import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfDay, subDays, addHours } from "date-fns";

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

	// Check if completed today
	const isCompletedToday = completions?.some((completion: HabitCompletion) => {
		const completionDate = startOfDay(new Date(completion.date));
		return (
			completionDate.getTime() === checkDate.getTime() && completion.completed
		);
	});

	if (isCompletedToday) {
		streak++;
	}

	// Check yesterday
	checkDate = subDays(checkDate, 1);
	const isCompletedYesterday = completions?.some(
		(completion: HabitCompletion) => {
			const completionDate = startOfDay(new Date(completion.date));
			return (
				completionDate.getTime() === checkDate.getTime() && completion.completed
			);
		}
	);

	if (isCompletedYesterday) {
		streak++;
	}

	// Check day before yesterday
	checkDate = subDays(checkDate, 1);
	const isCompletedDayBefore = completions?.some(
		(completion: HabitCompletion) => {
			const completionDate = startOfDay(new Date(completion.date));
			return (
				completionDate.getTime() === checkDate.getTime() && completion.completed
			);
		}
	);

	if (isCompletedDayBefore) {
		streak++;
	}

	// Continue checking previous days
	while (true) {
		checkDate = subDays(checkDate, 1);
		const isCompleted = completions?.some((completion: HabitCompletion) => {
			const completionDate = startOfDay(new Date(completion.date));
			return (
				completionDate.getTime() === checkDate.getTime() && completion.completed
			);
		});

		if (isCompleted) {
			streak++;
		} else {
			break;
		}
	}

	return streak;
}

/**
 * Check if a streak should be considered active
 * A streak is active if the habit was completed yesterday and the day before
 */
export function isStreakActive(
	completions: HabitCompletion[],
	currentDate: Date
): boolean {
	const yesterday = subDays(startOfDay(currentDate), 1);
	const dayBeforeYesterday = subDays(startOfDay(currentDate), 2);

	const isCompletedYesterday = completions?.some(
		(completion: HabitCompletion) => {
			const completionDate = startOfDay(new Date(completion.date));
			return (
				completionDate.getTime() === yesterday.getTime() && completion.completed
			);
		}
	);

	const isCompletedDayBefore = completions?.some(
		(completion: HabitCompletion) => {
			const completionDate = startOfDay(new Date(completion.date));
			return (
				completionDate.getTime() === dayBeforeYesterday.getTime() &&
				completion.completed
			);
		}
	);

	return isCompletedYesterday && isCompletedDayBefore;
}
