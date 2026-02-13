/**
 * Central shows management functions
 * Handles creating and fetching central show records
 */

import { createClient } from '@/lib/supabase/server';
import type { CentralShow } from '@/types/show';
import type { Venue } from '@/types/venue';

import { generateShowId } from './show-id';

/**
 * Find existing central show by date, artist, venue_id
 * Returns null if not found
 */
export async function findCentralShow(
	date: string,
	artist: string,
	venueId: string,
): Promise<CentralShow | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('central_shows')
		.select('*')
		.eq('date', date)
		.eq('artist', artist)
		.eq('venue_id', venueId)
		.single();

	if (error) {
		// Not found is expected, other errors should be thrown
		if (error.code === 'PGRST116') {
			return null;
		}
		throw error;
	}

	return data;
}

/**
 * Get or create a central show
 * If duplicate detected (same date/artist/venue), returns existing show
 * Returns metadata about whether the show was newly created and if it's a duplicate
 */
export async function getOrCreateCentralShow(params: {
	date: string;
	artist: string;
	venueId: string;
	allowDuplicate?: boolean;
}): Promise<{
	centralShow: CentralShow;
	isNew: boolean;
	isDuplicate?: boolean;
}> {
	const { date, artist, venueId, allowDuplicate = false } = params;

	// First, check if this exact show exists
	const existing = await findCentralShow(date, artist, venueId);

	if (existing) {
		return {
			centralShow: existing,
			isNew: false,
			isDuplicate: true,
		};
	}

	// If duplicate and not allowed, return the duplicate info
	if (existing && !allowDuplicate) {
		return {
			centralShow: existing,
			isNew: false,
			isDuplicate: true,
		};
	}

	// Create new central show
	const supabase = await createClient();

	// Check if there are any shows with the same base show_id (for sequence numbering)
	const baseShowId = generateShowId(date, artist, venueId);

	const { data: existingShows, error: countError } = await supabase
		.from('central_shows')
		.select('show_id')
		.like('show_id', `${baseShowId}%`);

	if (countError) {
		throw countError;
	}

	// Determine sequence number if needed
	let finalShowId = baseShowId;
	if (existingShows && existingShows.length > 0) {
		finalShowId = generateShowId(date, artist, venueId, existingShows.length);
	}

	// Insert new central show
	const { data: newShow, error: insertError } = await supabase
		.from('central_shows')
		.insert({
			show_id: finalShowId,
			date,
			artist,
			venue_id: venueId,
		})
		.select()
		.single();

	if (insertError) {
		throw insertError;
	}

	return {
		centralShow: newShow,
		isNew: true,
		isDuplicate: false,
	};
}

/**
 * Create multiple central shows (bulk operation for CSV upload)
 * Efficiently handles duplicates by checking all at once
 * Returns array of central shows (mix of new and existing)
 */
export async function createCentralShows(
	shows: Array<{ date: string; artist: string; venueId: string }>,
): Promise<CentralShow[]> {
	const supabase = await createClient();
	const centralShows: CentralShow[] = [];

	// Process shows in batches to avoid too many individual queries
	for (const show of shows) {
		const result = await getOrCreateCentralShow({
			date: show.date,
			artist: show.artist,
			venueId: show.venueId,
			allowDuplicate: true, // For CSV uploads, allow duplicates
		});

		centralShows.push(result.centralShow);
	}

	return centralShows;
}

/**
 * Get central shows by IDs with venue data joined
 * Used for fetching user show details
 */
export async function getCentralShowsByIds(
	ids: string[],
): Promise<(CentralShow & { venue: Venue })[]> {
	if (ids.length === 0) {
		return [];
	}

	const supabase = await createClient();

	const { data, error } = await supabase
		.from('central_shows')
		.select(
			`
      *,
      venue:venues(*)
    `,
		)
		.in('id', ids);

	if (error) {
		throw error;
	}

	// Type assertion needed because Supabase doesn't know about the joined venue
	return data as unknown as (CentralShow & { venue: Venue })[];
}

/**
 * Get central shows by show_ids (slug identifiers)
 * Useful for checking if specific shows exist
 */
export async function getCentralShowsByShowIds(
	showIds: string[],
): Promise<CentralShow[]> {
	if (showIds.length === 0) {
		return [];
	}

	const supabase = await createClient();

	const { data, error } = await supabase
		.from('central_shows')
		.select('*')
		.in('show_id', showIds);

	if (error) {
		throw error;
	}

	return data;
}
