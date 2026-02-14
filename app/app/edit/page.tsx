import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserShowWithDetails } from "@/types/show";
import type { UserProfile } from "@/types/profile";

import EditClient from "@/app/edit/EditClient";

// Increase timeout for pages with many shows
export const maxDuration = 60;

async function EditPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user_shows with joined central_shows and venues
  const supabase = await createClient();
  
  // Fetch user profile for rating config
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  const userProfile = profile as UserProfile | null;
  
  const { data: userShows, error } = await supabase
    .from("user_shows")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error('Error fetching user shows:', error);
  }

  // Transform the data to UserShowWithDetails format
  // Collect all show_ids from all user_shows to fetch in batched queries
  const allShowIds = (userShows || [])
    .flatMap((show: any) => show.show_ids || [])
    .filter((id): id is string => !!id);

  // Fetch all central shows with venue data in BATCHED queries to avoid URL length limits
  const centralShowsMap = new Map<string, any>();
  
  if (allShowIds.length > 0) {
    // Batch IDs to avoid URL length limits (PostgreSQL UUID is 36 chars + separators)
    // Safe batch size of 100 IDs keeps URL under 8KB
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < allShowIds.length; i += BATCH_SIZE) {
      const batch = allShowIds.slice(i, i + BATCH_SIZE);
      
      const { data: centralShows, error: centralError } = await supabase
        .from('central_shows')
        .select(`
          *,
          venues:venue_id (*)
        `)
        .in('id', batch);

      if (centralError) {
        console.error('Error fetching central shows batch:', centralError);
      } else if (centralShows) {
        // Add to map for quick lookup
        for (const cs of centralShows) {
          centralShowsMap.set((cs as any).id, cs);
        }
      }
    }
  }

  const transformedShows: UserShowWithDetails[] = [];

  for (const userShow of (userShows || []) as Array<{
    id: string;
    clerk_user_id: string;
    show_ids: string[];
    notes: string | null;
    rating: string | null;
    created_at: string;
    updated_at: string;
  }>) {
    if (!userShow.show_ids || userShow.show_ids.length === 0) {
      continue;
    }

    // Get central shows from the map instead of querying
    const centralShows = userShow.show_ids
      .map(id => centralShowsMap.get(id))
      .filter((cs): cs is any => !!cs);

    if (centralShows.length === 0) {
      continue;
    }

    // Transform to UserShowWithDetails
    transformedShows.push({
      id: userShow.id,
      clerk_user_id: userShow.clerk_user_id,
      show_ids: userShow.show_ids,
      notes: userShow.notes,
      rating: userShow.rating,
      created_at: userShow.created_at,
      updated_at: userShow.updated_at,
      shows: centralShows.map((cs: any) => ({
        id: cs.id,
        show_id: cs.show_id,
        date: cs.date,
        artist: cs.artist,
        venue_id: cs.venue_id,
        created_at: cs.created_at,
        updated_at: cs.updated_at,
        venue: cs.venues,
      })),
    });
  }

  // Sort by date (use first show's date)
  transformedShows.sort((a, b) => {
    const dateA = a.shows[0]?.date || '';
    const dateB = b.shows[0]?.date || '';
    return dateB.localeCompare(dateA);
  });

  // If no shows, redirect to upload page
  if (transformedShows.length === 0) {
    redirect("/upload");
  }

  // Extract rating system config if ratings are enabled
  const ratingSystemConfig =
    userProfile?.ratings_enabled && userProfile?.rating_system_config
      ? userProfile.rating_system_config
      : null;

  return <EditClient initialShows={transformedShows} ratingSystemConfig={ratingSystemConfig} />;
}

export default EditPage;
