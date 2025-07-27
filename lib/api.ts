import { Habit } from "./store";

interface RawHabitCompletion {
	id: string;
	habitId: string;
	date: string; // Date comes as string from API
	completed: boolean;
}

interface RawHabit {
	id: string;
	name: string;
	emoji: string;
	color: string;
	sortOrder: number;
	completions: RawHabitCompletion[];
}

export async function fetchHabits(): Promise<Habit[]> {
	const response = await fetch("/api/habits");
	if (!response.ok) {
		throw new Error("Failed to fetch habits");
	}
	const habits: RawHabit[] = await response.json();

	// Convert date strings back to Date objects in completions
	return habits.map((habit: RawHabit) => ({
		...habit,
		completions: habit.completions.map((completion: RawHabitCompletion) => ({
			...completion,
			date: new Date(completion.date),
		})),
	}));
}

export async function createHabit(data: {
	name: string;
	emoji: string;
	color: string;
}): Promise<Habit> {
	const response = await fetch("/api/habits", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error("Failed to create habit");
	}

	const habit: RawHabit = await response.json();

	// Convert date strings back to Date objects in completions
	return {
		...habit,
		completions: habit.completions.map((completion: RawHabitCompletion) => ({
			...completion,
			date: new Date(completion.date),
		})),
	};
}

export async function deleteHabit(
	id: string
): Promise<{ success: boolean; message?: string }> {
	const response = await fetch(`/api/habits?id=${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || "Failed to delete habit");
	}

	return response.json();
}

export async function toggleCompletion(
	habitId: string,
	date: Date
): Promise<void> {
	const response = await fetch("/api/habits/toggle-completion", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ habitId, date }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || "Failed to toggle completion");
	}
}

export async function updateHabit(
	id: string,
	data: {
		name: string;
		emoji: string;
		color: string;
	}
): Promise<Habit> {
	const response = await fetch(`/api/habits?id=${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error("Failed to update habit");
	}

	const habit: RawHabit = await response.json();

	// Convert date strings back to Date objects in completions
	return {
		...habit,
		completions: habit.completions.map((completion: RawHabitCompletion) => ({
			...completion,
			date: new Date(completion.date),
		})),
	};
}

export async function updateHabitSortOrder(
	habits: { id: string; sortOrder: number }[]
): Promise<void> {
	const response = await fetch("/api/habits/sort-order", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ habits }),
	});

	if (!response.ok) {
		throw new Error("Failed to update habit sort order");
	}
}
