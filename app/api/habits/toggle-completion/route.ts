import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
	try {
		const { habitId, date } = await request.json();

		if (!habitId || !date) {
			return NextResponse.json(
				{ error: "Missing habitId or date" },
				{ status: 400 }
			);
		}

		const dateObj = new Date(date);

		// First check if the habit exists
		const habit = await prisma.habit.findUnique({
			where: { id: habitId },
		});

		if (!habit) {
			return NextResponse.json({ error: "Habit not found" }, { status: 404 });
		}

		const existingCompletion = await prisma.habitCompletion.findFirst({
			where: {
				habitId,
				date: {
					gte: new Date(
						dateObj.getFullYear(),
						dateObj.getMonth(),
						dateObj.getDate()
					),
					lt: new Date(
						dateObj.getFullYear(),
						dateObj.getMonth(),
						dateObj.getDate() + 1
					),
				},
			},
		});

		if (existingCompletion) {
			await prisma.habitCompletion.update({
				where: { id: existingCompletion.id },
				data: { completed: !existingCompletion.completed },
			});
		} else {
			await prisma.habitCompletion.create({
				data: {
					habitId,
					date: dateObj,
					completed: true,
				},
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error toggling completion:", error);
		return NextResponse.json(
			{ error: "Failed to toggle completion" },
			{ status: 500 }
		);
	}
}
