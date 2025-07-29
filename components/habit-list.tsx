"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Check, X, Edit, GripVertical } from "lucide-react";
import { Habit, HabitCompletion, useHabitsStore } from "@/lib/store";
import { fetchHabits, deleteHabit, toggleCompletion } from "@/lib/api";
import { format, subDays, startOfDay, addDays } from "date-fns";
import { HabitModal } from "./habit-modal";

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
			// Load saved order first
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
		// Optimistically remove from UI
		deleteHabitFromStore(habitId);
		startOperation();

		try {
			// Perform background delete
			const result = await deleteHabit(habitId);
			console.log(result.message); // Log the success message with completion count
		} catch (error) {
			console.error("Error deleting habit:", error);
			// Revert optimistic update on error
			// You could implement a more sophisticated error handling here
			// For now, we'll just reload the habits
			const habitsData = await fetchHabits();
			setHabits(habitsData);
		} finally {
			finishOperation();
		}
	};

	const handleEditHabit = (habit: Habit) => {
		setHabitToEdit(habit);
		setIsModalOpen(true);
	};

	const handleToggleCompletion = async (habitId: string, date: Date) => {
		// Optimistically toggle in UI
		toggleCompletionInStore(habitId, date);
		startOperation();

		try {
			// Perform background toggle
			await toggleCompletion(habitId, date);
		} catch (error) {
			console.error("Error toggling completion:", error);
			// Revert optimistic update on error
			const habitsData = await fetchHabits();
			setHabits(habitsData);
		} finally {
			finishOperation();
		}
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

	// Generate dates for the last 14 days
	const today = new Date();
	const fourteenDaysAgo = subDays(today, 13); // 13 days back to include today (14 days total)
	const dates = useMemo(() => {
		const dateArray = [];
		let currentDate = fourteenDaysAgo;
		while (currentDate <= today) {
			dateArray.push(startOfDay(currentDate));
			currentDate = addDays(currentDate, 1);
		}
		return dateArray.reverse(); // Reverse to show newest dates on the left
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Calculate the width needed for the longest habit name
	const longestHabitNameWidth = useMemo(() => {
		if (habits.length === 0) return 120; // Default width
		const maxLength = Math.max(...habits.map(habit => habit.name.length));
		// Approximate width: ~6px per character + padding (smaller font)
		return Math.max(80, maxLength * 6 + 20);
	}, [habits]);

	// Check if a habit was completed on a specific date
	const isCompleted = (habit: Habit, date: Date) => {
		return habit.completions?.some((completion: HabitCompletion) => {
			const completionDate = startOfDay(new Date(completion.date));
			return (
				completionDate.getTime() === date.getTime() && completion.completed
			);
		});
	};

	// Calculate weekly completion percentage (last 7 days)
	const getWeeklyCompletionPercentage = (habit: Habit) => {
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			return startOfDay(subDays(new Date(), i));
		});
		const completedDays = last7Days.filter(date =>
			isCompleted(habit, date)
		).length;
		return (completedDays / 7) * 100;
	};

	// Calculate current streak (consecutive days completed)
	const getCurrentStreak = (habit: Habit) => {
		let streak = 0;
		let currentDate = startOfDay(new Date());

		while (isCompleted(habit, currentDate)) {
			streak++;
			currentDate = subDays(currentDate, 1);
		}

		return streak;
	};

	if (isLoading) {
		return (
			<div className="text-center py-8">
				<div className="inline-block w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
			</div>
		);
	}

	if (habits.length === 0) {
		return (
			<div className="text-center py-12 text-gray-400">
				{`No habits yet. Click the + button to add your first habit!`}
			</div>
		);
	}

	return (
		<>
			<div className="space-y-1">
				{/* Single scrollable container for dates and checkmarks */}
				<div className="overflow-x-auto">
					<div className="flex min-w-max mb-2">
						{/* Fixed column for progress ring with emoji and name */}
						<div
							className="flex-none pr-4"
							style={{ width: `${longestHabitNameWidth + 57.5}px` }}
						/>

						{/* Scrollable date headers */}
						<div className="flex gap-2">
							{dates.map((date, index) => (
								<div
									key={index}
									className="flex-none w-10 text-center text-xs text-gray-500 uppercase"
								>
									<div>{format(date, "EEE")}</div>
									<div>{format(date, "d")}</div>
								</div>
							))}
						</div>
					</div>

					{/* Habit rows */}
					{habits.map((habit, index) => {
						const completionPercentage = getWeeklyCompletionPercentage(habit);
						const currentStreak = getCurrentStreak(habit);
						const hasStreak = currentStreak >= 2;
						const isDragging = draggedHabitId === habit.id;
						const isDragOver = dragOverIndex === index;

						return (
							<div
								key={habit.id}
								draggable
								onDragStart={e => handleDragStart(e, habit.id)}
								onDragOver={e => handleDragOver(e, index)}
								onDragLeave={handleDragLeave}
								onDrop={e => handleDrop(e, index)}
								onDragEnd={handleDragEnd}
								className={`flex items-center gap-2 p-4 py-2 rounded-lg bg-gray-900 min-w-max relative transition-all duration-800 ease-in-out border my-0.5 ${
									hasStreak ? "border-green-500" : "border-gray-800"
								} ${
									isDragging
										? "opacity-50 scale-95 shadow-lg"
										: isDragOver
										? "border-blue-400 bg-blue-900/20"
										: ""
								} cursor-move`}
							>
								{/* Drag handle */}
								<div className="flex-none mr-2 text-gray-500 hover:text-gray-300 transition-colors">
									<GripVertical className="w-4 h-4" />
								</div>

								{/* Fire emoji for active streaks */}
								<div
									className={`absolute top-1.5 left-8 text-[10px] transition-all duration-800 ease-in-out ${
										hasStreak ? "opacity-100" : "opacity-0"
									}`}
								>
									🔥
								</div>

								{/* Column 1: Circular progress ring with emoji and name underneath */}
								<div
									className="flex-none text-center pr-4"
									style={{
										width: `${longestHabitNameWidth}px`,
									}}
								>
									<div className="relative w-12 h-12 mx-auto mb-2">
										<svg className="w-12 h-12 -rotate-90">
											<circle
												cx="24"
												cy="24"
												r="22"
												stroke={hasStreak ? "#22c55e" : habit.color}
												strokeWidth="2"
												fill="none"
												opacity="0.2"
											/>
											<circle
												cx="24"
												cy="24"
												r="22"
												stroke={hasStreak ? "#22c55e" : habit.color}
												strokeWidth="2"
												fill="none"
												strokeDasharray={`${2 * Math.PI * 22}`}
												strokeDashoffset={`${
													2 * Math.PI * 22 * (1 - completionPercentage / 100)
												}`}
												strokeLinecap="round"
												style={{
													transition: "stroke-dashoffset 0.8s ease-in-out",
												}}
											/>
										</svg>
										<button
											onClick={() =>
												handleToggleCompletion(habit.id, startOfDay(new Date()))
											}
											className="absolute inset-0 flex items-center justify-center text-xl cursor-pointer focus:outline-none focus:bg-transparent hover:bg-transparent"
										>
											{habit.emoji}
										</button>
									</div>
									<div
										className="text-xs font-medium truncate"
										style={{ color: hasStreak ? "#22c55e" : habit.color }}
									>
										{habit.name}
									</div>
								</div>

								{/* Columns 2+: Completion cells aligned with dates */}
								<div className="flex gap-2">
									{dates.map((date, dateIndex) => {
										const completed = isCompleted(habit, date);
										return (
											<button
												key={dateIndex}
												onClick={() => handleToggleCompletion(habit.id, date)}
												className="flex-none w-10 h-10 flex items-center justify-center rounded-md transition-colors focus:outline-none focus:bg-transparent hover:bg-transparent"
											>
												{completed ? (
													<Check
														className="w-5 h-5"
														style={{
															color: hasStreak ? "#22c55e" : habit.color,
														}}
													/>
												) : (
													<X className="w-5 h-5 text-gray-500" />
												)}
											</button>
										);
									})}
								</div>

								{/* Action buttons */}
								<div className="flex gap-1">
									<button
										onClick={() => handleEditHabit(habit)}
										disabled={false}
										className="flex-none p-2 rounded-md hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 disabled:opacity-50"
									>
										<Edit className="h-4 w-4" />
									</button>
									<button
										onClick={() => handleDeleteHabit(habit.id)}
										disabled={false}
										className="flex-none p-2 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Habit Modal */}
			<HabitModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				habitToEdit={habitToEdit}
			/>
		</>
	);
}
