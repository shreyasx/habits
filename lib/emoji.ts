/**
 * Check if a string is exactly one emoji grapheme cluster.
 * Handles ZWJ sequences (e.g. 👨‍👩‍👧‍👦), flags (e.g. 🇯🇵), skin tones, etc.
 */
export function isSingleEmoji(str: string): boolean {
	if (!str) return false;

	const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
	const segments = [...segmenter.segment(str)];

	if (segments.length !== 1) return false;

	return /\p{Extended_Pictographic}/u.test(segments[0].segment);
}
