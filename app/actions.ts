"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function toggleCompletion(habitId: string, date: Date) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return { success: false, error: "Unauthorized" };
		}

		const existingCompletion = await prisma.habitCompletion.findFirst({
			where: {
				habitId,
				userId,
				date: {
					gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
					lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
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
					userId,
					date,
					completed: true,
				},
			});
		}

		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("Error toggling completion:", error);
		return { success: false, error: "Failed to toggle completion" };
	}
}
