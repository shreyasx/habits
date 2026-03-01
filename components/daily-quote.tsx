"use client";

import { useEffect, useState } from "react";

interface Quote {
	text: string;
	author: string;
}

export function DailyQuote() {
	const [quote, setQuote] = useState<Quote | null>(null);

	useEffect(() => {
		fetch("/api/quote")
			.then(res => res.json())
			.then((data: Quote) => {
				if (data?.text) setQuote(data);
			})
			.catch(() => {});
	}, []);

	if (!quote) return null;

	return (
		<div className="px-6 py-8 text-center">
			<p className="text-[13px] leading-relaxed text-gray-500 italic">
				&ldquo;{quote.text}&rdquo;
			</p>
			<p className="text-xs text-gray-500 mt-1">
				&mdash; {quote.author}
			</p>
		</div>
	);
}
