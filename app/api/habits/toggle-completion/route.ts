import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { habitId, date, completed } = await request.json();

		if (!habitId || !date || typeof completed !== "boolean") {
			return NextResponse.json(
				{ error: "Missing habitId, date, or completed" },
				{ status: 400 }
			);
		}

		// Check if the habit exists and belongs to the user
		const habit = await prisma.habit.findUnique({
			where: { id: habitId, userId },
		});

		if (!habit) {
			return NextResponse.json({ error: "Habit not found" }, { status: 404 });
		}

		// date arrives as "YYYY-MM-DD" string from the client — parse as UTC midnight
		const dateOnly = new Date(date + "T00:00:00.000Z");

		if (completed) {
			await prisma.habitCompletion.upsert({
				where: { habitId_userId_date: { habitId, userId, date: dateOnly } },
				update: { completed: true },
				create: { habitId, userId, date: dateOnly, completed: true },
			});
		} else {
			await prisma.habitCompletion.deleteMany({
				where: { habitId, userId, date: dateOnly },
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error setting completion:", error);
		return NextResponse.json(
			{ error: "Failed to set completion" },
			{ status: 500 }
		);
	}
}
