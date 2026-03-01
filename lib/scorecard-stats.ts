import { Habit, HabitCompletion } from "./store";
import {
	startOfDay,
	subDays,
	differenceInDays,
	getDay,
	subWeeks,
	addDays,
} from "date-fns";
import { toDateString, getCurrentDate, calculateStreak } from "./utils";

// --- Types ---

export interface HabitStreakInfo {
	habitId: string;
	habitName: string;
	habitEmoji: string;
	habitColor: string;
	currentStreak: number;
	bestStreak: number;
	completionRate7d: number;
	completionRate30d: number;
	completionRateAllTime: number;
	totalCompletions: number;
}

export interface DayOfWeekStats {
	day: string;
	dayIndex: number;
	completionRate: number;
	totalCompletions: number;
}

export interface HeatmapCell {
	date: Date;
	dateStr: string;
	count: number;
	intensity: number;
}

export interface MotivationalTotals {
	totalCompletions: number;
	totalActiveDays: number;
	perfectDays: number;
	totalHabits: number;
	milestones: Milestone[];
}

export interface Milestone {
	title: string;
	description: string;
	icon: string;
	earned: boolean;
}

// --- Best Streak ---

export function calculateBestStreak(completions: HabitCompletion[]): number {
	if (!completions || completions.length === 0) return 0;

	const completedDates = completions
		.filter(c => c.completed)
		.map(c => toDateString(c.date))
		.filter((v, i, a) => a.indexOf(v) === i)
		.sort();

	if (completedDates.length === 0) return 0;

	let best = 1;
	let current = 1;

	for (let i = 1; i < completedDates.length; i++) {
		const prev = new Date(completedDates[i - 1] + "T00:00:00.000Z");
		const curr = new Date(completedDates[i] + "T00:00:00.000Z");
		const diff = differenceInDays(curr, prev);

		if (diff === 1) {
			current++;
			best = Math.max(best, current);
		} else {
			current = 1;
		}
	}

	return best;
}

// --- Per-Habit Stats ---

export function getHabitStreakInfos(habits: Habit[]): HabitStreakInfo[] {
	const today = getCurrentDate();

	return habits.map(habit => {
		const completedDates = habit.completions
			.filter(c => c.completed)
			.map(c => toDateString(c.date));

		const completedSet = new Set(completedDates);

		const rate = (days: number) => {
			let count = 0;
			for (let i = 0; i < days; i++) {
				const d = toDateString(subDays(today, i));
				if (completedSet.has(d)) count++;
			}
			return count / days;
		};

		let allTimeRate = 0;
		if (completedDates.length > 0) {
			const sorted = [...completedDates].sort();
			const firstDate = new Date(sorted[0] + "T00:00:00.000Z");
			const totalDays = differenceInDays(today, firstDate) + 1;
			allTimeRate = completedDates.length / Math.max(1, totalDays);
		}

		return {
			habitId: habit.id,
			habitName: habit.name,
			habitEmoji: habit.emoji,
			habitColor: habit.color,
			currentStreak: calculateStreak(habit.completions, today),
			bestStreak: calculateBestStreak(habit.completions),
			completionRate7d: rate(7),
			completionRate30d: rate(30),
			completionRateAllTime: allTimeRate,
			totalCompletions: completedDates.length,
		};
	});
}

// --- Overall Consistency Score ---

export function getOverallConsistency(habits: Habit[]): number {
	if (habits.length === 0) return 0;
	const infos = getHabitStreakInfos(habits);
	const avg =
		infos.reduce((sum, h) => sum + h.completionRate30d, 0) / infos.length;
	return avg;
}

// --- Heatmap Data ---

export function getHeatmapData(
	habits: Habit[],
	weeks: number = 13
): HeatmapCell[] {
	const today = getCurrentDate();
	const todayDow = getDay(today);
	const startDate = subDays(subWeeks(today, weeks - 1), todayDow);

	const countMap = new Map<string, number>();
	for (const habit of habits) {
		for (const c of habit.completions) {
			if (!c.completed) continue;
			const ds = toDateString(c.date);
			countMap.set(ds, (countMap.get(ds) || 0) + 1);
		}
	}

	const maxCount = Math.max(1, ...Array.from(countMap.values()));

	const cells: HeatmapCell[] = [];
	let d = startOfDay(startDate);
	while (d <= today) {
		const ds = toDateString(d);
		const count = countMap.get(ds) || 0;
		const intensity =
			count === 0
				? 0
				: Math.min(4, Math.ceil((count / maxCount) * 4));
		cells.push({ date: new Date(d), dateStr: ds, count, intensity });
		d = addDays(d, 1);
	}

	return cells;
}

// --- Day of Week Stats ---

export function getDayOfWeekStats(habits: Habit[]): DayOfWeekStats[] {
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const dayCounts = new Array(7).fill(0);
	const dayTotals = new Array(7).fill(0);

	const today = getCurrentDate();

	for (let i = 0; i < 90; i++) {
		const d = subDays(today, i);
		const dow = getDay(d);
		const ds = toDateString(d);
		dayTotals[dow] += habits.length;

		for (const habit of habits) {
			const completed = habit.completions.some(
				c => c.completed && toDateString(c.date) === ds
			);
			if (completed) dayCounts[dow]++;
		}
	}

	return dayNames.map((name, i) => ({
		day: name,
		dayIndex: i,
		completionRate: dayTotals[i] > 0 ? dayCounts[i] / dayTotals[i] : 0,
		totalCompletions: dayCounts[i],
	}));
}

// --- Motivational Totals ---

export function getMotivationalTotals(habits: Habit[]): MotivationalTotals {
	let totalCompletions = 0;
	const activeDays = new Set<string>();
	const dayHabitCounts = new Map<string, number>();

	for (const habit of habits) {
		for (const c of habit.completions) {
			if (!c.completed) continue;
			totalCompletions++;
			const ds = toDateString(c.date);
			activeDays.add(ds);
			dayHabitCounts.set(ds, (dayHabitCounts.get(ds) || 0) + 1);
		}
	}

	let perfectDays = 0;
	if (habits.length > 0) {
		for (const [, count] of dayHabitCounts) {
			if (count >= habits.length) perfectDays++;
		}
	}

	// Check for best streak across all habits
	let maxStreak = 0;
	for (const habit of habits) {
		maxStreak = Math.max(
			maxStreak,
			calculateBestStreak(habit.completions)
		);
	}

	// Check for consecutive perfect days
	let perfectDayStreak = 0;
	let bestPerfectStreak = 0;
	if (habits.length > 0) {
		const sortedDays = [...dayHabitCounts.entries()]
			.filter(([, count]) => count >= habits.length)
			.map(([ds]) => ds)
			.sort();

		perfectDayStreak = 0;
		for (let i = 0; i < sortedDays.length; i++) {
			if (i === 0) {
				perfectDayStreak = 1;
			} else {
				const prev = new Date(sortedDays[i - 1] + "T00:00:00.000Z");
				const curr = new Date(sortedDays[i] + "T00:00:00.000Z");
				if (differenceInDays(curr, prev) === 1) {
					perfectDayStreak++;
				} else {
					perfectDayStreak = 1;
				}
			}
			bestPerfectStreak = Math.max(bestPerfectStreak, perfectDayStreak);
		}
	}

	// Overall consistency (30d)
	const overallRate =
		habits.length > 0
			? totalCompletions /
				Math.max(1, habits.length * activeDays.size)
			: 0;

	const milestones: Milestone[] = [
		{
			title: "First Step",
			description: "Complete your first habit",
			icon: "footprints",
			earned: totalCompletions >= 1,
		},
		{
			title: "Getting Started",
			description: "7 total completions",
			icon: "seedling",
			earned: totalCompletions >= 7,
		},
		{
			title: "Dedicated",
			description: "30 total completions",
			icon: "fire",
			earned: totalCompletions >= 30,
		},
		{
			title: "Centurion",
			description: "100 total completions",
			icon: "trophy",
			earned: totalCompletions >= 100,
		},
		{
			title: "Unstoppable",
			description: "500 total completions",
			icon: "rocket",
			earned: totalCompletions >= 500,
		},
		{
			title: "Streak Master",
			description: "7+ day streak on any habit",
			icon: "flame",
			earned: maxStreak >= 7,
		},
		{
			title: "Perfect Week",
			description: "7 consecutive perfect days",
			icon: "star",
			earned: bestPerfectStreak >= 7,
		},
		{
			title: "Consistency King",
			description: "80%+ overall completion rate",
			icon: "crown",
			earned: overallRate >= 0.8 && activeDays.size >= 30,
		},
	];

	return {
		totalCompletions,
		totalActiveDays: activeDays.size,
		perfectDays,
		totalHabits: habits.length,
		milestones,
	};
}
