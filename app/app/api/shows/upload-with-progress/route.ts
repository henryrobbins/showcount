import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getOrCreateCentralShow } from '@/lib/central-shows';
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

      if (show.country === 'USA' && (!show.venue || !show.city || !show.state)) {
        return NextResponse.json(
          { error: 'USA venues require name, city, state, and country' },
          { status: 400 }
        );
      }
    }

    // Create a readable stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const userShowsToInsert: any[] = [];
          
          // Cache venues as we process them to avoid duplicate lookups
          const venueCache = new Map<string, { id: string | null; status: string }>();

          // Process each show and send updates in real-time
          for (let i = 0; i < shows.length; i++) {
            const show = shows[i];
            let venueId: string | null = null;
            let venueStatus: UploadProgress['venueStatus'] = 'none';
            
            if (show.venue) {
              const key = `${show.venue}|${show.city || ''}|${show.state || ''}|${show.country || ''}`;
              
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
                  state: show.state || null,
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

            if (!venueId) {
              // Skip shows without venues
              continue;
            }

            // Create central shows for each artist
            const showIds: string[] = [];
            for (const artist of show.artists) {
              const result = await getOrCreateCentralShow({
                date: show.date,
                artist,
                venueId,
                allowDuplicate: true, // CSV uploads allow duplicates
              });
              showIds.push(result.centralShow.id);
            }

            // Prepare user_show for insertion
            userShowsToInsert.push({
              clerk_user_id: show.clerk_user_id,
              show_ids: showIds,
              notes: show.notes || null,
              // Legacy fields set to null
              date: null,
              artists: null,
              venue_id: null,
              venue: null,
              city: null,
              state: null,
              country: null,
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

          // Insert all user_shows
          const supabase = await createClient();
          const { data, error } = await supabase
            .from('user_shows')
            .insert(userShowsToInsert as any)
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
