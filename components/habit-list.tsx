"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit, GripVertical } from "lucide-react";
import { Habit, HabitCompletion, useHabitsStore } from "@/lib/store";
import { fetchHabits, deleteHabit } from "@/lib/api";
import { scheduleToggleSync, cancelPendingTogglesForHabit, safeRefetch } from "@/lib/sync";
import { format, subDays, startOfDay, addDays } from "date-fns";
import { HabitModal } from "./habit-modal";
import { getCurrentDate, calculateStreak, isStreakActive, toDateString } from "@/lib/utils";

export function HabitList() {
	const {
		habits,
		isLoading,
		draggedHabitId,
		setHabits,
		setLoading,
		startOperation,
		finishOperation,
		deleteHabit: deleteHabitFromStore,
		toggleCompletion: toggleCompletionInStore,
		setDraggedHabitId,
		reorderHabits,
		loadHabitOrder,
	} = useHabitsStore();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	// Load habits and order on mount
	useEffect(() => {
		const loadHabits = async () => {
			loadHabitOrder();
			setLoading(true);
			try {
				const habitsData = await fetchHabits();
				setHabits(habitsData);
			} catch (error) {
				console.error("Failed to load habits:", error);
			} finally {
				setLoading(false);
			}
		};
		loadHabits();
	}, [setHabits, setLoading, loadHabitOrder]);

	const handleDeleteHabit = async (habitId: string) => {
		cancelPendingTogglesForHabit(habitId);
		deleteHabitFromStore(habitId);
		startOperation();
		try {
			await deleteHabit(habitId);
			useHabitsStore.getState().setError(false);
		} catch (error) {
			console.error("Error deleting habit:", error);
			useHabitsStore.getState().setError(true);
			await safeRefetch();
		} finally {
			finishOperation();
		}
	};

	const handleEditHabit = (habit: Habit) => {
		setHabitToEdit(habit);
		setIsModalOpen(true);
	};

	const handleToggleCompletion = (habitId: string, date: Date) => {
		toggleCompletionInStore(habitId, date);
		scheduleToggleSync(habitId, date);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setHabitToEdit(null);
	};

	// Drag and drop handlers
	const handleDragStart = (e: React.DragEvent, habitId: string) => {
		setDraggedHabitId(habitId);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", habitId);
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDragOverIndex(index);
	};

	const handleDragLeave = () => {
		setDragOverIndex(null);
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		setDragOverIndex(null);
		setDraggedHabitId(null);
		if (draggedHabitId) {
			const dragIndex = habits.findIndex(habit => habit.id === draggedHabitId);
			if (dragIndex !== -1 && dragIndex !== dropIndex) {
				reorderHabits(dragIndex, dropIndex);
			}
		}
	};

	const handleDragEnd = () => {
		setDraggedHabitId(null);
		setDragOverIndex(null);
	};

	// Generate dates for the last 14 days using 4am day transition
	const today = getCurrentDate();
	const fourteenDaysAgo = subDays(today, 13);
	const dates = useMemo(() => {
		const dateArray = [];
		let currentDate = fourteenDaysAgo;
		while (currentDate <= today) {
			dateArray.push(startOfDay(currentDate));
			currentDate = addDays(currentDate, 1);
		}
		return dateArray.reverse();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Calculate the width needed for the longest habit name
	const longestHabitNameWidth = useMemo(() => {
		if (habits.length === 0) return 120;
		const maxLength = Math.max(...habits.map(habit => habit.name.length));
		return Math.max(80, maxLength * 6 + 20);
	}, [habits]);

	const isCompleted = (habit: Habit, date: Date) => {
		const dateStr = toDateString(date);
		return habit.completions?.some(
			(completion: HabitCompletion) =>
				completion.date.toISOString().split("T")[0] === dateStr &&
				completion.completed
		);
	};

	const getCurrentStreak = (habit: Habit) => {
		return calculateStreak(habit.completions, getCurrentDate());
	};

	if (isLoading) {
		return (
			<div className="text-center py-8">
				<div className="inline-block w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin"></div>
			</div>
		);
	}

	if (habits.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500 text-sm">
				{`No habits yet. Tap + to get started.`}
			</div>
		);
	}

	// Fixed column width: grip(18) + gap(8) + emoji(36) + gap(10) + name + padding(12)
	const fixedColumnWidth = longestHabitNameWidth + 84;

	return (
		<>
			<div>
				<div className="overflow-x-auto">
					{/* Date headers */}
					<div className="flex min-w-max mb-1.5">
						<div
							className="flex-none"
							style={{ width: `${fixedColumnWidth}px` }}
						/>
						<div className="flex gap-[3px]">
							{dates.map((date, index) => {
								const dateIsToday =
									date.getTime() === today.getTime();
								return (
									<div
										key={index}
										className={`flex-none w-9 text-center text-[10px] leading-tight ${
											dateIsToday
												? "text-gray-300"
												: "text-gray-600"
										}`}
									>
										<div className="uppercase tracking-wide">
											{format(date, "EEE")}
										</div>
										<div
											className={
												dateIsToday
													? "font-semibold"
													: ""
											}
										>
											{format(date, "d")}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Habit rows */}
					{habits.map((habit, index) => {
						const currentStreak = getCurrentStreak(habit);
						const hasStreak = isStreakActive(
							habit.completions,
							getCurrentDate()
						);
						const isDragging = draggedHabitId === habit.id;
						const isDragOver = dragOverIndex === index;

						return (
							<div
								key={habit.id}
								draggable
								onDragStart={e =>
									handleDragStart(e, habit.id)
								}
								onDragOver={e => handleDragOver(e, index)}
								onDragLeave={handleDragLeave}
								onDrop={e => handleDrop(e, index)}
								onDragEnd={handleDragEnd}
								className={`flex items-center py-2.5 px-2 rounded-xl min-w-max transition-all duration-300 ${
									isDragging
										? "opacity-40 scale-[0.98]"
										: isDragOver
										? "bg-gray-800/40"
										: ""
								} cursor-move`}
								style={{
									background:
										hasStreak && !isDragging
											? `linear-gradient(90deg, ${habit.color}0A 0%, transparent 50%)`
											: undefined,
								}}
							>
								{/* Drag handle */}
								<div className="flex-none mr-2 text-gray-700">
									<GripVertical className="w-[14px] h-[14px]" />
								</div>

								{/* Emoji + Name */}
								<div
									className="flex items-center gap-2.5 flex-none pr-3"
									style={{
										width: `${longestHabitNameWidth + 56}px`,
									}}
								>
									<div className="relative flex-none">
										<button
											onClick={() =>
												handleToggleCompletion(
													habit.id,
													getCurrentDate()
												)
											}
											className="w-9 h-9 rounded-lg flex items-center justify-center text-[17px] transition-all duration-300 focus:outline-none active:scale-90"
											style={{
												background: `${habit.color}15`,
												boxShadow: hasStreak
													? `0 0 18px ${habit.color}30, 0 0 4px ${habit.color}20`
													: "none",
											}}
										>
											{habit.emoji}
										</button>
										{hasStreak && currentStreak > 1 && (
											<span
												className="absolute -bottom-1 -right-1.5 text-[8px] font-bold leading-none px-[5px] py-[2px] rounded-full min-w-[15px] text-center"
												style={{
													background: habit.color,
													color: "#000",
												}}
											>
												{currentStreak}
											</span>
										)}
									</div>
									<span className="text-[13px] font-medium text-gray-400 truncate">
										{habit.name}
									</span>
								</div>

								{/* Completion grid */}
								<div className="flex gap-[3px]">
									{dates.map((date, dateIndex) => {
										const completed = isCompleted(
											habit,
											date
										);
										const dateIsToday =
											date.getTime() ===
											today.getTime();
										return (
											<button
												key={dateIndex}
												onClick={() =>
													handleToggleCompletion(
														habit.id,
														date
													)
												}
												className="flex-none w-9 h-9 flex items-center justify-center transition-all duration-150 focus:outline-none active:scale-90"
											>
												{completed ? (
													<div
														className="w-[14px] h-[14px] rounded-[4px] transition-all duration-200"
														style={{
															background:
																habit.color,
															boxShadow: `0 0 6px ${habit.color}40`,
														}}
													/>
												) : (
													<div
														className={`w-[14px] h-[14px] rounded-[4px] transition-all duration-200 ${
															dateIsToday
																? "bg-gray-700/80"
																: "bg-gray-800/40"
														}`}
													/>
												)}
											</button>
										);
									})}
								</div>

								{/* Action buttons */}
								<div className="flex gap-0.5 ml-1">
									<button
										onClick={() =>
											handleEditHabit(habit)
										}
										className="flex-none p-1.5 rounded-md text-gray-700 hover:text-gray-400 transition-colors focus:outline-none"
									>
										<Edit className="h-3.5 w-3.5" />
									</button>
									<button
										onClick={() =>
											handleDeleteHabit(habit.id)
										}
										className="flex-none p-1.5 rounded-md text-gray-700 hover:text-red-400 transition-colors focus:outline-none"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<HabitModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				habitToEdit={habitToEdit}
			/>
		</>
	);
}
