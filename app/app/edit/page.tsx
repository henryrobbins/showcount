import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Show } from "@/types/show";

import EditClient from "@/app/edit/EditClient";

async function EditPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user's shows from Supabase with venue data
  const supabase = await createClient();
  const { data: shows, error } = await supabase
    .from("shows")
    .select(`
      *,
      venues (
        id,
        name,
        city,
        state,
        country,
        latitude,
        longitude
      )
    `)
    .eq("clerk_user_id", userId)
    .order("date", { ascending: false });

  // Denormalize venue data for backward compatibility
  const userShows = (shows || []).map((show: any) => {
    // If show has a venue_id and venues data, use that
    if (show.venue_id && show.venues) {
      const venue = Array.isArray(show.venues) ? show.venues[0] : show.venues;
      return {
        ...show,
        venue: venue?.name || show.venue || null,
        city: venue?.city || show.city || null,
        state: venue?.state || show.state || null,
        country: venue?.country || show.country || null,
        // Remove the nested venues object from the result
        venues: undefined,
      } as Show;
    }
    // Otherwise use legacy fields
    return show as Show;
  });

  // If no shows, redirect to upload page
  if (userShows.length === 0) {
    redirect("/upload");
  }

  return <EditClient initialShows={userShows} />;
}

export default EditPage;
