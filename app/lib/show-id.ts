/**
 * Utility functions for generating and parsing show_id slugs
 * Format: {date}-{artist-slug}-{venue_id}[-{sequence}]
 * Example: 2026-02-13-phish-abc123-def456
 */

/**
 * Normalize artist name to kebab-case slug
 * Removes non-alphanumeric characters and converts to lowercase
 * Example: "Trey Anastasio" → "trey-anastasio"
 * Example: "moe." → "moe"
 */
export function normalizeArtistName(artist: string): string {
	// Trim whitespace
	const trimmed = artist.trim();

	// Convert to lowercase and replace non-alphanumeric chars with hyphens
	const normalized = trimmed
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-+/g, "-") // Replace consecutive hyphens with single hyphen
		.replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

	return normalized;
}

/**
 * Generate a unique show_id slug
 * Format: {date}-{artist-slug}-{venue_id}
 * For duplicates (same artist/venue/date), append sequence number: -1, -2, etc.
 *
 * @param date - ISO format YYYY-MM-DD
 * @param artist - Artist name (e.g., "Phish", "Trey Anastasio")
 * @param venueId - UUID of the venue
 * @param sequence - Optional sequence number for same-day duplicates
 * @returns show_id slug
 */
export function generateShowId(
	date: string,
	artist: string,
	venueId: string,
	sequence?: number,
): string {
	const artistSlug = normalizeArtistName(artist);
	const baseId = `${date}-${artistSlug}-${venueId}`;

	if (sequence !== undefined && sequence > 0) {
		return `${baseId}-${sequence}`;
	}

	return baseId;
}

/**
 * Parse a show_id back into its components
 * Handles both formats:
 * - {date}-{artist-slug}-{venue_id}
 * - {date}-{artist-slug}-{venue_id}-{sequence}
 *
 * @param showId - show_id slug to parse
 * @returns Parsed components
 */
export function parseShowId(showId: string): {
	date: string;
	artist: string;
	venueId: string;
	sequence?: number;
} {
	const parts = showId.split("-");

	if (parts.length < 3) {
		throw new Error(`Invalid show_id format: ${showId}`);
	}

	// Date is first part (YYYY-MM-DD format, so parts[0]-parts[1]-parts[2])
	const date = `${parts[0]}-${parts[1]}-${parts[2]}`;

	// Find where the UUID starts (UUIDs contain hyphens, so we need to find the pattern)
	// Venue UUID typically starts after the artist slug
	// Format: YYYY-MM-DD-artist-slug-uuid-uuid-uuid-uuid-uuid[-sequence]

	// Strategy: venue_id is the last 5 hyphen-separated parts before optional sequence
	// or if sequence exists, it's the 5 parts before the last part

	// Check if last part is a number (sequence)
	const lastPart = parts[parts.length - 1];
	const hasSequence = /^\d+$/.test(lastPart);

	let venueIdStart: number;
	let sequence: number | undefined;

	if (hasSequence) {
		sequence = Number.parseInt(lastPart, 10);
		// Venue ID is the 5 parts before the sequence
		venueIdStart = parts.length - 6;
	} else {
		// Venue ID is the last 5 parts
		venueIdStart = parts.length - 5;
	}

	// Venue ID (5 parts for UUID format)
	const venueId = parts.slice(venueIdStart, venueIdStart + 5).join("-");

	// Artist slug is everything between date and venue_id
	const artistSlug = parts.slice(3, venueIdStart).join("-");

	return {
		date,
		artist: artistSlug,
		venueId,
		sequence,
	};
}
