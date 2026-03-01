import { useHabitsStore } from "./store";
import { setCompletion, fetchHabits } from "./api";
import { toDateString } from "./utils";

type PendingToggle = {
	timer: ReturnType<typeof setTimeout>;
};

const pendingToggles = new Map<string, PendingToggle>();
let refetchPromise: Promise<void> | null = null;

const DEBOUNCE_MS = 300;

function getToggleKey(habitId: string, date: Date): string {
	return `${habitId}:${toDateString(date)}`;
}

/**
 * Schedule a completion sync for a habit+date.
 * Debounces rapid changes: only the final state gets sent to the server.
 * The desired state is read from the store when the API call fires,
 * guaranteeing it matches what the user sees.
 */
export function scheduleToggleSync(habitId: string, date: Date): void {
	const key = getToggleKey(habitId, date);
	const existing = pendingToggles.get(key);

	if (existing) {
		// Same habit+date toggled again within debounce window.
		// Cancel the pending timer — we'll reschedule with a fresh window.
		// Don't touch pendingOperations: we already incremented once for this key.
		clearTimeout(existing.timer);
	} else {
		// First toggle for this debounce group — register one pending operation.
		useHabitsStore.getState().startOperation();
	}

	const timer = setTimeout(() => executeSync(key, habitId, date), DEBOUNCE_MS);
	pendingToggles.set(key, { timer });
}

async function executeSync(
	key: string,
	habitId: string,
	date: Date
): Promise<void> {
	pendingToggles.delete(key);
	const state = useHabitsStore.getState();

	// Habit was created optimistically but the server hasn't responded yet.
	// Skip the sync — completions will be reconciled on next full load.
	if (habitId.startsWith("temp-")) {
		state.finishOperation();
		return;
	}

	// Habit was deleted before the debounce timer fired.
	const habit = state.habits.find(h => h.id === habitId);
	if (!habit) {
		state.finishOperation();
		return;
	}

	// Read the current desired state from the store — this is what the user sees.
	const dateStr = toDateString(date);
	const completion = habit.completions.find(
		c => c.date.toISOString().split("T")[0] === dateStr
	);
	const completed = completion?.completed ?? false;

	try {
		await setCompletion(habitId, date, completed);
		useHabitsStore.getState().setError(false);
	} catch (error) {
		console.error("Error syncing completion:", error);
		useHabitsStore.getState().setError(true);
		await safeRefetch();
	} finally {
		useHabitsStore.getState().finishOperation();
	}
}

/**
 * Deduplicated refetch — at most one in-flight at a time.
 * Subsequent callers join the same promise.
 */
export async function safeRefetch(): Promise<void> {
	if (refetchPromise) return refetchPromise;

	refetchPromise = (async () => {
		try {
			const habits = await fetchHabits();
			useHabitsStore.getState().setHabits(habits);
			useHabitsStore.getState().setError(false);
		} catch (error) {
			console.error("Error refetching habits:", error);
		} finally {
			refetchPromise = null;
		}
	})();

	return refetchPromise;
}

/**
 * Cancel all pending toggle syncs for a specific habit.
 * Call this before deleting a habit to avoid orphaned API calls.
 */
export function cancelPendingTogglesForHabit(habitId: string): void {
	for (const [key, pending] of pendingToggles) {
		if (key.startsWith(`${habitId}:`)) {
			clearTimeout(pending.timer);
			pendingToggles.delete(key);
			useHabitsStore.getState().finishOperation();
		}
	}
}
