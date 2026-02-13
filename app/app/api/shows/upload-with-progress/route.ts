import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getOrCreateVenueWithStatus } from '@/lib/venues';
import type { ShowInsert } from '@/types/show';

export interface UploadProgress {
  type: 'progress' | 'complete' | 'error';
  currentShow?: number;
  totalShows?: number;
  showInfo?: {
    date: string;
    artists: string[];
    venue?: string;
  };
  venueStatus?: 'existing' | 'created_with_osm' | 'created_without_osm' | 'failed' | 'none';
  message?: string;
  error?: string;
}

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

    // Validate all shows upfront
    for (const show of shows) {
      if (show.clerk_user_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: cannot insert shows for other users' },
          { status: 403 }
        );
      }

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

      if (show.country === 'USA' && (!show.venue || !show.city)) {
        return NextResponse.json(
          { error: 'USA venues require name, city, and country' },
          { status: 400 }
        );
      }
    }

    // Create a readable stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const showsWithVenueIds: any[] = [];
          
          // Cache venues as we process them to avoid duplicate lookups
          const venueCache = new Map<string, { id: string | null; status: string }>();

          // Process each show and send updates in real-time
          for (let i = 0; i < shows.length; i++) {
            const show = shows[i];
            let venueId: string | null = null;
            let venueStatus: UploadProgress['venueStatus'] = 'none';
            
            if (show.venue) {
              const key = `${show.venue}|${show.city || ''}|${show.country || ''}`;
              
              // Check if we've already processed this venue
              if (venueCache.has(key)) {
                const cached = venueCache.get(key)!;
                venueId = cached.id;
                venueStatus = cached.status as UploadProgress['venueStatus'];
              } else {
                // Look up or create venue with status
                const result = await getOrCreateVenueWithStatus({
                  name: show.venue,
                  city: show.city || null,
                  country: show.country || null,
                });
                
                venueId = result.venueId;
                venueStatus = result.status as UploadProgress['venueStatus'];
                
                // Cache the result
                venueCache.set(key, {
                  id: result.venueId,
                  status: result.status,
                });
              }
            }

            // Prepare show for insertion
            showsWithVenueIds.push({
              clerk_user_id: show.clerk_user_id,
              date: show.date,
              artists: show.artists,
              venue_id: venueId,
              venue: null,
              city: null,
              state: null,
              country: null,
              notes: show.notes || null,
            });

            // Send progress update immediately
            const progressUpdate: UploadProgress = {
              type: 'progress',
              currentShow: i + 1,
              totalShows: shows.length,
              showInfo: {
                date: show.date,
                artists: show.artists,
                venue: show.venue || undefined,
              },
              venueStatus,
              message: `Processing show ${i + 1} of ${shows.length}`,
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(progressUpdate)}\n\n`)
            );
          }

          // Insert all shows
          const supabase = await createClient();
          const { data, error } = await supabase
            .from('shows')
            .insert(showsWithVenueIds as any)
            .select();

          if (error) {
            console.error('Supabase error:', error);
            const errorUpdate: UploadProgress = {
              type: 'error',
              error: 'Failed to save shows to database',
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`)
            );
          } else {
            // Send completion update
            const completeUpdate: UploadProgress = {
              type: 'complete',
              message: `Successfully uploaded ${data.length} shows`,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(completeUpdate)}\n\n`)
            );
          }

          controller.close();
        } catch (error) {
          console.error('Upload error:', error);
          const errorUpdate: UploadProgress = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Internal server error',
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
