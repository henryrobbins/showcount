import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getOrCreateCentralShow } from '@/lib/central-shows';
import { validateRatingValue } from '@/lib/rating-validation';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateVenueWithStatus } from '@/lib/venues';
import type { ShowInsert } from '@/types/show';
import type { Database } from '@/types/database';

// Increase timeout for CSV uploads (Vercel default is 10s)
// Hobby: max 10s, Pro: max 60s, Enterprise: max 300s
export const maxDuration = 60;

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

    // Fetch user profile to validate ratings if present
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('ratings_enabled, rating_system_config')
      .eq('clerk_user_id', userId)
      .single<Pick<Database['public']['Tables']['user_profiles']['Row'], 'ratings_enabled' | 'rating_system_config'>>();

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

      // Validate rating if present
      if (show.rating !== undefined && show.rating !== null && show.rating !== '') {
        if (!profile?.ratings_enabled) {
          return NextResponse.json(
            { error: 'Ratings are not enabled for your profile. Enable ratings in your profile settings before uploading shows with ratings.' },
            { status: 400 }
          );
        }

        if (!validateRatingValue(show.rating, profile.rating_system_config)) {
          return NextResponse.json(
            { error: `Invalid rating value "${show.rating}" for your rating system` },
            { status: 400 }
          );
        }
      }
    }

    // Create a readable stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        console.log(`[Upload] Starting upload for user ${userId} with ${shows.length} shows`);
        
        try {
          const BATCH_SIZE = 10; // Insert in batches to avoid timeout issues
          const userShowsToInsert: any[] = [];
          
          // Cache venues as we process them to avoid duplicate lookups
          const venueCache = new Map<string, { id: string | null; status: string }>();
          
          // Keep track of total inserted
          let totalInserted = 0;

          // Process each show and send updates in real-time
          for (let i = 0; i < shows.length; i++) {
            const show = shows[i];
            console.log(`[Upload] Processing show ${i + 1}/${shows.length}: ${show.date} - ${show.artists.join(', ')}`);
            
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
              console.log(`[Upload] Skipping show ${i + 1} - no venue ID`);
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
              rating: show.rating || null,
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
            
            // Insert in batches to prevent timeout issues
            if (userShowsToInsert.length >= BATCH_SIZE || i === shows.length - 1) {
              console.log(`[Upload] Inserting batch of ${userShowsToInsert.length} user_shows`);
              const insertSupabase = await createClient();
              const { data, error } = await insertSupabase
                .from('user_shows')
                .insert(userShowsToInsert as any)
                .select();

              if (error) {
                console.error('[Upload] Batch insert error:', error);
                const errorUpdate: UploadProgress = {
                  type: 'error',
                  error: `Failed to save shows to database: ${error.message || 'Unknown error'}`,
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`)
                );
                controller.close();
                return;
              }
              
              totalInserted += data.length;
              console.log(`[Upload] Batch inserted ${data.length} user_shows. Total: ${totalInserted}`);
              
              // Clear the batch
              userShowsToInsert.length = 0;
            }
          }

          console.log(`[Upload] Successfully inserted total of ${totalInserted} user_shows for user ${userId}`);
          // Send completion update
          const completeUpdate: UploadProgress = {
            type: 'complete',
            message: `Successfully uploaded ${totalInserted} shows`,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completeUpdate)}\n\n`)
          );

          controller.close();
        } catch (error) {
          console.error('[Upload] Upload error:', error);
          console.error('[Upload] Error details:', error instanceof Error ? error.stack : JSON.stringify(error));
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
