import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getOrCreateVenue } from '@/lib/venues';
import type { Database } from '@/types/database';
import type { ShowInsert } from '@/types/show';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shows } = body as { shows: ShowInsert[] };

    if (!shows || !Array.isArray(shows) || shows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: shows array required' },
        { status: 400 }
      );
    }

    for (const show of shows) {
      if (show.clerk_user_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: cannot insert shows for other users' },
          { status: 403 }
        );
      }

      // Validate notes if present
      if (show.notes !== undefined && show.notes !== null) {
        if (typeof show.notes !== 'string') {
          return NextResponse.json(
            { error: 'Notes must be a string' },
            { status: 400 }
          );
        }
        if (show.notes.length > 4096) {
          return NextResponse.json(
            { error: `Notes must not exceed 4096 characters (found ${show.notes.length})` },
            { status: 400 }
          );
        }
      }

      // Validate venue fields: USA requires all three fields
      if (show.country === 'USA' && (!show.venue || !show.city)) {
        return NextResponse.json(
          { error: 'USA venues require name, city, and country' },
          { status: 400 }
        );
      }
    }

    // Extract unique venues from all shows
    interface VenueKey {
      name: string;
      city: string | null;
      country: string | null;
    }

    const venueMap = new Map<string, VenueKey>();
    
    for (const show of shows) {
      if (show.venue) {
        const key = `${show.venue}|${show.city || ''}|${show.country || ''}`;
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            name: show.venue,
            city: show.city || null,
            country: show.country || null,
          });
        }
      }
    }

    // Get or create venues (this will handle rate limiting internally)
    const venueIdMap = new Map<string, string | null>();
    
    for (const [key, venueParams] of venueMap.entries()) {
      const venueId = await getOrCreateVenue(venueParams);
      venueIdMap.set(key, venueId);
    }

    // Map venue IDs to shows
    const showsWithVenueIds = shows.map((show) => {
      let venueId: string | null = null;
      
      if (show.venue) {
        const key = `${show.venue}|${show.city || ''}|${show.country || ''}`;
        venueId = venueIdMap.get(key) || null;
      }

      return {
        clerk_user_id: show.clerk_user_id,
        date: show.date,
        artists: show.artists,
        venue_id: venueId,
        venue: null, // Legacy fields set to null
        city: null,
        state: null,
        country: null,
        notes: show.notes || null,
      };
    });

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('shows')
      .insert(showsWithVenueIds as any)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save shows to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      shows: data,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
