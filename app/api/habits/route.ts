import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		const habits = await prisma.habit.findMany({
			orderBy: { sortOrder: "asc" },
			include: {
				completions: true,
			},
		});

		return NextResponse.json(habits);
	} catch (error) {
		console.error("Error fetching habits:", error);
		return NextResponse.json(
			{ error: "Failed to fetch habits" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, emoji, color } = body;

		// Get the highest sortOrder to place new habit at the end
		const maxSortOrder = await prisma.habit.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const habit = await prisma.habit.create({
			data: {
				name,
				emoji,
				color,
				sortOrder: (maxSortOrder?.sortOrder ?? 0) + 1,
			},
			include: {
				completions: true,
			},
		});

		return NextResponse.json(habit);
	} catch (error) {
		console.error("Error creating habit:", error);
		return NextResponse.json(
			{ error: "Failed to create habit" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Habit ID is required" },
				{ status: 400 }
			);
		}

		// First check if the habit exists
		const existingHabit = await prisma.habit.findUnique({
			where: { id },
			include: {
				completions: true,
			},
		});

		if (!existingHabit) {
			return NextResponse.json({ error: "Habit not found" }, { status: 404 });
		}

		// Delete the habit (completions will be automatically deleted due to cascade)
		await prisma.habit.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: `Habit "${existingHabit.name}" and ${existingHabit.completions.length} completion(s) deleted successfully`,
		});
	} catch (error) {
		console.error("Error deleting habit:", error);
		return NextResponse.json(
			{ error: "Failed to delete habit" },
			{ status: 500 }
		);
	}
}
