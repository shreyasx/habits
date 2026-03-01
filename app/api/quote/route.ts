import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
	try {
		// Check for a fresh cached quote
		const cached = await prisma.quote.findFirst({
			orderBy: { fetchedAt: "desc" },
		});

		if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
			return NextResponse.json({ text: cached.text, author: cached.author });
		}

		// Fetch from external API
		try {
			const res = await fetch("https://zenquotes.io/api/random");
			const data = await res.json();

			if (data?.[0]?.q) {
				const { q: text, a: author } = data[0];

				// Store in DB cache
				const quote = await prisma.quote.create({
					data: { text, author },
				});

				return NextResponse.json({ text: quote.text, author: quote.author });
			}
		} catch {
			// External API failed — fall back to stale cache
		}

		// Graceful degradation: return stale cached quote if available
		if (cached) {
			return NextResponse.json({ text: cached.text, author: cached.author });
		}

		return NextResponse.json(
			{ error: "No quote available" },
			{ status: 503 }
		);
	} catch (error) {
		console.error("Error fetching quote:", error);
		return NextResponse.json(
			{ error: "Failed to fetch quote" },
			{ status: 500 }
		);
	}
}
