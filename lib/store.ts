import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { updateHabitSortOrder } from "./api";

export interface Habit {
	id: string;
	name: string;
	emoji: string;
	color: string;
	sortOrder: number;
	completions: HabitCompletion[];
}

export interface HabitCompletion {
	id: string;
	habitId: string;
	date: Date;
	completed: boolean;
}

interface HabitsState {
	habits: Habit[];
	isLoading: boolean;
	pendingOperations: number;
	hasError: boolean;
	draggedHabitId: string | null;
	hasUserReordered: boolean;

	// Actions
	setHabits: (habits: Habit[]) => void;
	addHabit: (habit: Habit) => void;
	updateHabit: (id: string, updates: Partial<Habit>) => void;
	updateHabitId: (oldId: string, newId: string) => void;
	deleteHabit: (id: string) => void;
	toggleCompletion: (habitId: string, date: Date) => void;
	setLoading: (loading: boolean) => void;
	setError: (hasError: boolean) => void;
	startOperation: () => void;
	finishOperation: () => void;
	setDraggedHabitId: (id: string | null) => void;
	reorderHabits: (fromIndex: number, toIndex: number) => void;
	setHasUserReordered: (hasReordered: boolean) => void;
	loadHabitOrder: () => void;
	saveHabitOrder: () => void;
}

const HABIT_ORDER_KEY = "habit-order";

export const useHabitsStore = create<HabitsState>()(
	devtools(
		(set, get) => ({
			habits: [],
			isLoading: false,
			pendingOperations: 0,
			hasError: false,
			draggedHabitId: null,
			hasUserReordered: false,

			setHabits: habits => {
				const state = get();
				let sortedHabits = [...habits];

				// If user hasn't reordered, sort by creation date (newest first)
				if (!state.hasUserReordered) {
					sortedHabits = sortedHabits.sort((a, b) => b.sortOrder - a.sortOrder);
				} else {
					// Try to restore saved order from localStorage
					try {
						const savedOrder = localStorage.getItem(HABIT_ORDER_KEY);
						if (savedOrder) {
							const orderData = JSON.parse(savedOrder);
							if (orderData.habitIds && Array.isArray(orderData.habitIds)) {
								// Create a map of habit IDs to their saved positions
								const orderMap = new Map();
								orderData.habitIds.forEach((id: string, index: number) => {
									orderMap.set(id, index);
								});

								// Sort habits according to saved order
								sortedHabits.sort((a, b) => {
									const aIndex = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
									const bIndex = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
									return aIndex - bIndex;
								});
							}
						}
					} catch (error) {
						console.error(
							"Failed to restore habit order from localStorage:",
							error
						);
						// Fallback to sort order if localStorage fails
						sortedHabits = sortedHabits.sort(
							(a, b) => b.sortOrder - a.sortOrder
						);
					}
				}

				set({ habits: sortedHabits });
			},

			addHabit: habit =>
				set(state => ({
					habits: [...state.habits, habit],
				})),

			updateHabit: (id, updates) =>
				set(state => ({
					habits: state.habits.map(habit =>
						habit.id === id ? { ...habit, ...updates } : habit
					),
				})),

			updateHabitId: (oldId, newId) =>
				set(state => ({
					habits: state.habits.map(habit =>
						habit.id === oldId ? { ...habit, id: newId } : habit
					),
				})),

			deleteHabit: id =>
				set(state => ({
					habits: state.habits.filter(habit => habit.id !== id),
				})),

			toggleCompletion: (habitId, date) =>
				set(state => ({
					habits: state.habits.map(habit => {
						if (habit.id !== habitId) return habit;

						const dateStr = date.toISOString().split("T")[0];
						const existingCompletion = habit.completions.find(
							comp => comp.date.toISOString().split("T")[0] === dateStr
						);

						if (existingCompletion) {
							// Toggle existing completion
							return {
								...habit,
								completions: habit.completions.map(comp =>
									comp.id === existingCompletion.id
										? { ...comp, completed: !comp.completed }
										: comp
								),
							};
						} else {
							// Add new completion
							const newCompletion: HabitCompletion = {
								id: `temp-${Date.now()}`,
								habitId,
								date,
								completed: true,
							};
							return {
								...habit,
								completions: [...habit.completions, newCompletion],
							};
						}
					}),
				})),

			setLoading: isLoading => set({ isLoading }),
			setError: hasError => set({ hasError }),
			startOperation: () =>
				set(state => ({ pendingOperations: state.pendingOperations + 1 })),
			finishOperation: () =>
				set(state => ({
					pendingOperations: Math.max(0, state.pendingOperations - 1),
				})),

			setDraggedHabitId: id => set({ draggedHabitId: id }),

			reorderHabits: (fromIndex, toIndex) => {
				set(state => {
					const newHabits = [...state.habits];
					const [movedHabit] = newHabits.splice(fromIndex, 1);
					newHabits.splice(toIndex, 0, movedHabit);

					// Update sortOrder for all habits
					const updatedHabits = newHabits.map((habit, index) => ({
						...habit,
						sortOrder: newHabits.length - index, // Higher numbers = higher priority
					}));

					return {
						habits: updatedHabits,
						hasUserReordered: true,
					};
				});
				// Save to localStorage
				get().saveHabitOrder();

				// Update sort order in database
				const state = get();
				const habitsWithSortOrder = state.habits.map(habit => ({
					id: habit.id,
					sortOrder: habit.sortOrder,
				}));

				updateHabitSortOrder(habitsWithSortOrder).catch(error => {
					console.error("Failed to update habit sort order:", error);
				});
			},

			setHasUserReordered: hasReordered =>
				set({ hasUserReordered: hasReordered }),

			loadHabitOrder: () => {
				try {
					const savedOrder = localStorage.getItem(HABIT_ORDER_KEY);
					if (savedOrder) {
						const orderData = JSON.parse(savedOrder);
						set({ hasUserReordered: orderData.hasUserReordered });
					}
				} catch (error) {
					console.error("Failed to load habit order from localStorage:", error);
				}
			},

			saveHabitOrder: () => {
				try {
					const state = get();
					const orderData = {
						habitIds: state.habits.map(habit => habit.id),
						hasUserReordered: state.hasUserReordered,
					};
					localStorage.setItem(HABIT_ORDER_KEY, JSON.stringify(orderData));
				} catch (error) {
					console.error("Failed to save habit order to localStorage:", error);
				}
			},
		}),
		{
			name: "habits-store",
		}
	)
);
