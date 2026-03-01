"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useHabitsStore, Habit } from "@/lib/store";
import { createHabit, updateHabit } from "@/lib/api";
import { isSingleEmoji } from "@/lib/emoji";
import { scheduleToggleSync, safeRefetch } from "@/lib/sync";

interface HabitModalProps {
	isOpen: boolean;
	onClose: () => void;
	habitToEdit?: Habit | null;
}

const DEFAULT_EMOJI = "🎯";

const COLORS = [
	"#ef4444", // red
	"#f97316", // orange
	"#eab308", // yellow
	"#06b6d4", // cyan
	"#3b82f6", // blue
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#f59e0b", // amber
];

export function HabitModal({
	isOpen,
	onClose,
	habitToEdit,
}: HabitModalProps) {
	const [name, setName] = useState("");
	const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);
	const [emojiInput, setEmojiInput] = useState(DEFAULT_EMOJI);
	const [selectedColor, setSelectedColor] = useState(COLORS[0]);
	const [isVisible, setIsVisible] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	const {
		addHabit,
		updateHabit: updateHabitInStore,
		updateHabitId,
		deleteHabit: deleteHabitFromStore,
		startOperation,
		finishOperation,
		setError,
	} = useHabitsStore();

	const isEmojiValid = isSingleEmoji(emojiInput);

	// Initialize form with habit data when editing
	useEffect(() => {
		if (habitToEdit) {
			setName(habitToEdit.name);
			setSelectedEmoji(habitToEdit.emoji);
			setEmojiInput(habitToEdit.emoji);
			setSelectedColor(habitToEdit.color);
		} else {
			// Reset form for adding new habit
			setName("");
			setSelectedEmoji(DEFAULT_EMOJI);
			setEmojiInput(DEFAULT_EMOJI);
			setSelectedColor(COLORS[0]);
		}
	}, [habitToEdit]);

	// Handle animation timing
	useEffect(() => {
		if (isOpen) {
			// Show modal immediately when opening
			setIsVisible(true);
			// Trigger animation on next frame
			requestAnimationFrame(() => {
				setIsAnimating(true);
			});
		} else {
			// Start closing animation
			setIsAnimating(false);
			// Delay hiding to allow animation to complete
			const timer = setTimeout(() => {
				setIsVisible(false);
			}, 200); // Match the transition duration
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	const resetForm = () => {
		setName("");
		setSelectedEmoji(DEFAULT_EMOJI);
		setEmojiInput(DEFAULT_EMOJI);
		setSelectedColor(COLORS[0]);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		const trimmedName = name.trim();

		if (habitToEdit) {
			// --- Edit flow ---
			updateHabitInStore(habitToEdit.id, {
				name: trimmedName,
				emoji: selectedEmoji,
				color: selectedColor,
			});
			resetForm();
			onClose();

			// Background sync — pending operation tracks the full lifecycle
			startOperation();
			try {
				await updateHabit(habitToEdit.id, {
					name: trimmedName,
					emoji: selectedEmoji,
					color: selectedColor,
				});
				setError(false);
			} catch (error) {
				console.error("Error updating habit:", error);
				setError(true);
				await safeRefetch();
			} finally {
				finishOperation();
			}
		} else {
			// --- Create flow ---
			const tempHabit = {
				id: `temp-${Date.now()}`,
				name: trimmedName,
				emoji: selectedEmoji,
				color: selectedColor,
				sortOrder: Date.now(),
				completions: [],
			};

			addHabit(tempHabit);
			resetForm();
			onClose();

			// Background sync — await the full create before finishing
			startOperation();
			try {
				const createdHabit = await createHabit({
					name: trimmedName,
					emoji: selectedEmoji,
					color: selectedColor,
				});
				updateHabitId(tempHabit.id, createdHabit.id);
				setError(false);

				// Sync any completions the user toggled while the habit had a temp ID
				const currentHabit = useHabitsStore
					.getState()
					.habits.find(h => h.id === createdHabit.id);
				if (currentHabit) {
					for (const comp of currentHabit.completions) {
						if (comp.id.startsWith("temp-")) {
							scheduleToggleSync(createdHabit.id, comp.date);
						}
					}
				}
			} catch (error) {
				console.error("Error creating habit:", error);
				setError(true);
				deleteHabitFromStore(tempHabit.id);
			} finally {
				finishOperation();
			}
		}
	};

	if (!isVisible) return null;

	const isEditing = !!habitToEdit;

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ease-out ${
				isAnimating
					? "bg-black/50 backdrop-blur-sm"
					: "bg-black/0 backdrop-blur-none pointer-events-none"
			}`}
			onClick={onClose}
		>
			<div
				className={`bg-background border rounded-lg p-6 w-full max-w-md mx-4 transform transition-all duration-200 ease-out ${
					isAnimating
						? "scale-100 opacity-100 translate-y-0"
						: "scale-95 opacity-0 translate-y-4"
				}`}
				onClick={e => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-white">
						{isEditing ? "Edit Habit" : "Add Habit"}
					</h2>
					<button
						onClick={onClose}
						className="p-1 rounded-md hover:bg-secondary transition-colors duration-150"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Habit Name
						</label>
						<input
							type="text"
							value={name}
							onChange={e => setName(e.target.value)}
							className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150"
							placeholder="Enter habit name..."
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Emoji
						</label>
						<div className="flex items-center gap-3">
							<span className="text-4xl w-12 h-12 flex items-center justify-center bg-secondary rounded-md shrink-0">
								{isEmojiValid ? selectedEmoji : "❓"}
							</span>
							<div className="flex-1">
								<input
									type="text"
									value={emojiInput}
									onChange={e => {
										const val = e.target.value;
										setEmojiInput(val);
										if (isSingleEmoji(val)) {
											setSelectedEmoji(val);
										}
									}}
									className={`w-full px-3 py-2 bg-secondary border rounded-md text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-150 ${
										emojiInput && !isEmojiValid
											? "border-red-500 focus:ring-red-500"
											: "border-border focus:ring-primary"
									}`}
									placeholder="Type or paste an emoji"
								/>
								{emojiInput && !isEmojiValid && (
									<p className="text-red-400 text-xs mt-1">
										Please enter a single emoji
									</p>
								)}
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Color
						</label>
						<div className="grid grid-cols-8 gap-2">
							{COLORS.map(color => (
								<button
									key={color}
									type="button"
									onClick={() => setSelectedColor(color)}
									className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
										selectedColor === color
											? "border-white scale-110"
											: "border-transparent hover:scale-110"
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-border rounded-md text-white hover:bg-secondary transition-colors duration-150"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!name.trim() || !isEmojiValid}
							className="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 disabled:hover:scale-100"
						>
							{isEditing ? "Update Habit" : "Add Habit"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
