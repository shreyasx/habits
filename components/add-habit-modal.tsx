"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useHabitsStore } from "@/lib/store";
import { createHabit } from "@/lib/api";

interface AddHabitModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLoadingChange?: (loading: boolean) => void;
}

const EMOJIS = [
	"🏃‍♂️",
	"💧",
	"📚",
	"🧘‍♀️",
	"🥗",
	"💤",
	"🏋️‍♂️",
	"🧠",
	"🎯",
	"🌟",
	"💪",
	"🎨",
	"🎵",
	"🌱",
	"☕",
	"🚶‍♂️",
];

const COLORS = [
	"#ef4444", // red
	"#f97316", // orange
	"#eab308", // yellow
	"#10b981", // emerald
	"#06b6d4", // cyan
	"#3b82f6", // blue
	"#8b5cf6", // violet
	"#ec4899", // pink
];

export function AddHabitModal({
	isOpen,
	onClose,
	onLoadingChange,
}: AddHabitModalProps) {
	const [name, setName] = useState("");
	const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
	const [selectedColor, setSelectedColor] = useState(COLORS[0]);
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	const { addHabit, updateHabitId, startOperation, finishOperation } =
		useHabitsStore();

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsLoading(true);
		onLoadingChange?.(true);
		startOperation();

		try {
			// Create temporary habit for instant UI update
			const tempHabit = {
				id: `temp-${Date.now()}`,
				name: name.trim(),
				emoji: selectedEmoji,
				color: selectedColor,
				sortOrder: Date.now(),
				completions: [],
			};

			// Optimistically add to UI
			addHabit(tempHabit);

			// Reset form and close modal immediately
			setName("");
			setSelectedEmoji(EMOJIS[0]);
			setSelectedColor(COLORS[0]);
			onClose();

			// Perform background creation and update ID when complete
			createHabit({
				name: name.trim(),
				emoji: selectedEmoji,
				color: selectedColor,
			})
				.then(createdHabit => {
					// Update the temporary ID with the real database ID
					updateHabitId(tempHabit.id, createdHabit.id);
					// Success - operation completed
					finishOperation();
				})
				.catch(error => {
					console.error("Error creating habit:", error);
					// You could implement error handling here, like showing a toast notification
					// or reverting the optimistic update
					finishOperation();
				});
		} catch (error) {
			console.error("Error in form submission:", error);
			finishOperation();
		} finally {
			setIsLoading(false);
			onLoadingChange?.(false);
		}
	};

	if (!isVisible) return null;

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
					<h2 className="text-xl font-semibold text-white">Add Habit</h2>
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
						<div className="grid grid-cols-8 gap-2">
							{EMOJIS.map(emoji => (
								<button
									key={emoji}
									type="button"
									onClick={() => setSelectedEmoji(emoji)}
									className={`p-2 rounded-md text-xl transition-all duration-150 flex items-center justify-center ${
										selectedEmoji === emoji
											? "bg-primary ring-2 ring-primary scale-105"
											: "hover:bg-secondary hover:scale-105"
									}`}
								>
									{emoji}
								</button>
							))}
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
							disabled={isLoading || !name.trim()}
							className="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 disabled:hover:scale-100"
						>
							{isLoading ? "Adding..." : "Add Habit"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
