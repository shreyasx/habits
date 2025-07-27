import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { habits } = body;

		if (!Array.isArray(habits)) {
			return NextResponse.json(
				{ error: "Habits array is required" },
				{ status: 400 }
			);
		}

		// Update sort order for all habits in a transaction
		await prisma.$transaction(
			habits.map((habit: { id: string; sortOrder: number }) =>
				prisma.habit.update({
					where: { id: habit.id, userId },
					data: { sortOrder: habit.sortOrder },
				})
			)
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating habit sort order:", error);
		return NextResponse.json(
			{ error: "Failed to update habit sort order" },
			{ status: 500 }
		);
	}
}
