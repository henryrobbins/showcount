import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserShowWithDetails } from "@/types/show";

import EditClient from "@/app/edit/EditClient";

async function EditPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user_shows with joined central_shows and venues
  const supabase = await createClient();
  const { data: userShows, error } = await supabase
    .from("user_shows")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error('Error fetching user shows:', error);
  }

  // Transform the data to UserShowWithDetails format
  const transformedShows: UserShowWithDetails[] = [];

  for (const userShow of (userShows || []) as Array<{
    id: string;
    clerk_user_id: string;
    show_ids: string[];
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>) {
    if (!userShow.show_ids || userShow.show_ids.length === 0) {
      continue;
    }

    // Fetch central shows with venue data for this user show
    const { data: centralShows, error: centralError } = await supabase
      .from('central_shows')
      .select(`
        *,
        venues:venue_id (*)
      `)
      .in('id', userShow.show_ids);

    if (centralError) {
      console.error('Error fetching central shows:', centralError);
      continue;
    }

    // Transform to UserShowWithDetails
    transformedShows.push({
      id: userShow.id,
      clerk_user_id: userShow.clerk_user_id,
      show_ids: userShow.show_ids,
      notes: userShow.notes,
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

  return <EditClient initialShows={transformedShows} />;
}

export default EditPage;
