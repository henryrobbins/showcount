import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { findCentralShow, getCentralShowsByIds } from '@/lib/central-shows';

/**
 * Check if a show already exists before creating
 * POST /api/shows/check-duplicate
 * Body: { date, artist, venueId }
 * Response: { exists: boolean, centralShow?: CentralShow & { venue: Venue } }
 */
export async function POST(request: Request) {
	try {
		// Verify authentication
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { date, artist, venueId } = body;

		// Validate input
		if (!date || !artist || !venueId) {
			return NextResponse.json(
				{ error: 'Missing required fields: date, artist, venueId' },
				{ status: 400 },
			);
		}

		// Check if central show exists
		const centralShow = await findCentralShow(date, artist, venueId);

		if (!centralShow) {
			return NextResponse.json({
				exists: false,
			});
		}

		// Fetch with venue data
		const [showWithVenue] = await getCentralShowsByIds([centralShow.id]);

		return NextResponse.json({
			exists: true,
			centralShow: showWithVenue,
		});
	} catch (error) {
		console.error('Error checking duplicate show:', error);
		return NextResponse.json(
			{ error: 'Failed to check duplicate show' },
			{ status: 500 },
		);
	}
}
