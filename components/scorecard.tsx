"use client";

import { useMemo } from "react";
import { useHabitsStore } from "@/lib/store";
import {
	getHabitStreakInfos,
	getOverallConsistency,
	getHeatmapData,
	getDayOfWeekStats,
	getMotivationalTotals,
	HeatmapCell,
	HabitStreakInfo,
	DayOfWeekStats,
	MotivationalTotals,
	Milestone,
} from "@/lib/scorecard-stats";
import {
	Flame,
	Calendar,
	TrendingUp,
	Star,
	Zap,
	Trophy,
	Footprints,
	Sprout,
	Rocket,
	Crown,
	Lock,
} from "lucide-react";
import { format } from "date-fns";

export function Scorecard() {
	const { habits } = useHabitsStore();

	const streakInfos = useMemo(() => getHabitStreakInfos(habits), [habits]);
	const consistency = useMemo(() => getOverallConsistency(habits), [habits]);
	const heatmapData = useMemo(() => getHeatmapData(habits), [habits]);
	const dayOfWeekStats = useMemo(() => getDayOfWeekStats(habits), [habits]);
	const totals = useMemo(() => getMotivationalTotals(habits), [habits]);

	if (habits.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500 text-sm">
				No habits yet. Add some habits to see your scorecard.
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-8">
			<OverviewSection totals={totals} consistency={consistency} />
			<StreaksSection streakInfos={streakInfos} />
			<HeatmapSection data={heatmapData} />
			<DayOfWeekSection stats={dayOfWeekStats} />
			<MilestonesSection milestones={totals.milestones} />
		</div>
	);
}

// --- Overview Section ---

function OverviewSection({
	totals,
	consistency,
}: {
	totals: MotivationalTotals;
	consistency: number;
}) {
	const stats = [
		{
			icon: <Zap className="h-4 w-4 text-yellow-400" />,
			value: totals.totalCompletions,
			label: "Completions",
		},
		{
			icon: <Calendar className="h-4 w-4 text-blue-400" />,
			value: totals.totalActiveDays,
			label: "Active Days",
		},
		{
			icon: <Star className="h-4 w-4 text-purple-400" />,
			value: totals.perfectDays,
			label: "Perfect Days",
		},
		{
			icon: <TrendingUp className="h-4 w-4 text-green-400" />,
			value: `${Math.round(consistency * 100)}%`,
			label: "30d Consistency",
		},
	];

	return (
		<div>
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
				Overview
			</h2>
			<div className="grid grid-cols-2 gap-3">
				{stats.map((s, i) => (
					<div key={i} className="bg-gray-900 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-1.5">
							{s.icon}
							<span className="text-[11px] text-gray-500">
								{s.label}
							</span>
						</div>
						<div className="text-2xl font-bold text-white">
							{s.value}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// --- Streaks Section ---

function StreaksSection({
	streakInfos,
}: {
	streakInfos: HabitStreakInfo[];
}) {
	return (
		<div>
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
				Streaks & Consistency
			</h2>
			<div className="space-y-2">
				{streakInfos.map(info => (
					<div
						key={info.habitId}
						className="bg-gray-900 rounded-xl p-3.5"
					>
						<div className="flex items-center gap-2.5 mb-3">
							<span
								className="text-lg w-8 h-8 rounded-lg flex items-center justify-center"
								style={{
									background: `${info.habitColor}15`,
								}}
							>
								{info.habitEmoji}
							</span>
							<span className="text-sm font-medium text-gray-300 flex-1 truncate">
								{info.habitName}
							</span>
							<div className="flex items-center gap-1.5">
								<Flame
									className="h-4 w-4"
									style={{ color: info.habitColor }}
								/>
								<span className="text-base font-bold text-white">
									{info.currentStreak}
								</span>
							</div>
						</div>
						<div className="grid grid-cols-4 gap-2 text-center">
							<StatCell
								label="Best"
								value={`${info.bestStreak}`}
							/>
							<StatCell
								label="7d"
								value={`${Math.round(info.completionRate7d * 100)}%`}
							/>
							<StatCell
								label="30d"
								value={`${Math.round(info.completionRate30d * 100)}%`}
							/>
							<StatCell
								label="All"
								value={`${Math.round(info.completionRateAllTime * 100)}%`}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function StatCell({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-[10px] text-gray-600 uppercase">{label}</div>
			<div className="text-sm font-semibold text-gray-300">{value}</div>
		</div>
	);
}

// --- Heatmap Section ---

function HeatmapSection({ data }: { data: HeatmapCell[] }) {
	const weeks: HeatmapCell[][] = [];
	let currentWeek: HeatmapCell[] = [];

	for (const cell of data) {
		const dow = cell.date.getDay();
		if (dow === 0 && currentWeek.length > 0) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
		currentWeek.push(cell);
	}
	if (currentWeek.length > 0) weeks.push(currentWeek);

	const intensityColors = [
		"bg-gray-800/40",
		"bg-green-900/70",
		"bg-green-700/80",
		"bg-green-500",
		"bg-green-400",
	];

	const dayLabels = ["", "M", "", "W", "", "F", ""];

	// Get month labels for the heatmap
	const monthLabels: { label: string; weekIndex: number }[] = [];
	let lastMonth = -1;
	weeks.forEach((week, wi) => {
		const firstDay = week[0];
		const month = firstDay.date.getMonth();
		if (month !== lastMonth) {
			monthLabels.push({
				label: format(firstDay.date, "MMM"),
				weekIndex: wi,
			});
			lastMonth = month;
		}
	});

	return (
		<div>
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
				Activity
			</h2>
			<div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
				{/* Month labels */}
				<div className="flex gap-[3px] mb-1 ml-[18px]">
					{weeks.map((_, wi) => {
						const monthLabel = monthLabels.find(
							m => m.weekIndex === wi
						);
						return (
							<div
								key={wi}
								className="w-[11px] text-[9px] text-gray-600 flex-none"
							>
								{monthLabel ? monthLabel.label : ""}
							</div>
						);
					})}
				</div>
				<div className="flex gap-[3px] min-w-max">
					{/* Day labels column */}
					<div className="flex flex-col gap-[3px] mr-0.5">
						{dayLabels.map((label, i) => (
							<div
								key={i}
								className="w-[11px] h-[11px] text-[9px] text-gray-600 flex items-center justify-center"
							>
								{label}
							</div>
						))}
					</div>
					{/* Week columns */}
					{weeks.map((week, wi) => (
						<div key={wi} className="flex flex-col gap-[3px]">
							{wi === 0 &&
								week.length < 7 &&
								Array.from({
									length: 7 - week.length,
								}).map((_, i) => (
									<div
										key={`pad-${i}`}
										className="w-[11px] h-[11px]"
									/>
								))}
							{week.map(cell => (
								<div
									key={cell.dateStr}
									className={`w-[11px] h-[11px] rounded-[2px] ${intensityColors[cell.intensity]}`}
									title={`${cell.dateStr}: ${cell.count} completion${cell.count !== 1 ? "s" : ""}`}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// --- Day of Week Section ---

function DayOfWeekSection({ stats }: { stats: DayOfWeekStats[] }) {
	// Reorder to start from Mon
	const ordered = [...stats.slice(1), stats[0]];
	const maxRate = Math.max(...ordered.map(s => s.completionRate), 0.01);

	return (
		<div>
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
				Day of Week
			</h2>
			<div className="bg-gray-900 rounded-xl p-4 space-y-2.5">
				{ordered.map(stat => (
					<div key={stat.day} className="flex items-center gap-3">
						<span className="text-xs text-gray-500 w-8 font-medium">
							{stat.day}
						</span>
						<div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${Math.round((stat.completionRate / maxRate) * 100)}%`,
									backgroundColor:
										stat.completionRate >= 0.7
											? "#22c55e"
											: stat.completionRate >= 0.4
												? "#eab308"
												: "#ef4444",
								}}
							/>
						</div>
						<span className="text-xs text-gray-400 w-8 text-right font-medium">
							{Math.round(stat.completionRate * 100)}%
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

// --- Milestones Section ---

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
	footprints: <Footprints className="h-5 w-5" />,
	seedling: <Sprout className="h-5 w-5" />,
	fire: <Flame className="h-5 w-5" />,
	trophy: <Trophy className="h-5 w-5" />,
	rocket: <Rocket className="h-5 w-5" />,
	flame: <Flame className="h-5 w-5" />,
	star: <Star className="h-5 w-5" />,
	crown: <Crown className="h-5 w-5" />,
};

function MilestonesSection({ milestones }: { milestones: Milestone[] }) {
	return (
		<div>
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
				Milestones
			</h2>
			<div className="flex gap-3 overflow-x-auto pb-2">
				{milestones.map((m, i) => (
					<div
						key={i}
						className={`flex-none w-28 rounded-xl p-3.5 text-center ${
							m.earned
								? "bg-gray-900"
								: "bg-gray-900/50 opacity-40"
						}`}
					>
						<div
							className={`mb-2 flex justify-center ${
								m.earned ? "text-yellow-400" : "text-gray-600"
							}`}
						>
							{m.earned ? (
								MILESTONE_ICONS[m.icon] || (
									<Trophy className="h-5 w-5" />
								)
							) : (
								<Lock className="h-5 w-5" />
							)}
						</div>
						<div
							className={`text-xs font-semibold mb-0.5 ${
								m.earned ? "text-white" : "text-gray-600"
							}`}
						>
							{m.title}
						</div>
						<div className="text-[10px] text-gray-500 leading-tight">
							{m.description}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
