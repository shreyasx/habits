import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
}

export const useHabitsStore = create<HabitsState>()(
	devtools(
		set => ({
			habits: [],
			isLoading: false,
			pendingOperations: 0,
			hasError: false,

			setHabits: habits => set({ habits }),

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
		}),
		{
			name: "habits-store",
		}
	)
);
