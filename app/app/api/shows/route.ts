import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getOrCreateCentralShow, getCentralShowsByIds } from "@/lib/central-shows";
import { validateRatingValue } from "@/lib/rating-validation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateVenue } from "@/lib/venues";
import type { Database } from "@/types/database";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, artists, venue, city, state, country, notes, rating, allowDuplicate } = body;

    // Validate required fields
    if (!date || !artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json(
        { error: "Date and at least one artist are required" },
        { status: 400 }
      );
    }

    // Validate notes if present
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== "string") {
        return NextResponse.json(
          { error: "Notes must be a string" },
          { status: 400 }
        );
      }
      if (notes.length > 4096) {
        return NextResponse.json(
          { error: "Notes must not exceed 4096 characters" },
          { status: 400 }
        );
      }
    }

    // Validate rating if present
    if (rating !== undefined && rating !== null && rating !== '') {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('ratings_enabled, rating_system_config')
        .eq('clerk_user_id', userId)
        .single();

      if (!profile?.ratings_enabled) {
        return NextResponse.json(
          { error: "Ratings are not enabled for your profile" },
          { status: 400 }
        );
      }

      if (!validateRatingValue(rating, profile.rating_system_config)) {
        return NextResponse.json(
          { error: "Invalid rating value for your rating system" },
          { status: 400 }
        );
      }
    }

    // Validate venue fields: USA requires all four fields
    if (country === "USA" && (!venue || !city || !state)) {
      return NextResponse.json(
        { error: "USA venues require name, city, state, and country" },
        { status: 400 }
      );
    }

    // Get or create venue if venue name is provided
    let venueId: string | null = null;
    if (venue) {
      venueId = await getOrCreateVenue({
        name: venue,
        city: city || null,
        state: state || null,
        country: country || null,
      });
    }

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue is required" },
        { status: 400 }
      );
    }

    // Create or get central shows for each artist
    const showIds: string[] = [];
    let hasDuplicate = false;

    for (const artist of artists) {
      const result = await getOrCreateCentralShow({
        date,
        artist,
        venueId,
        allowDuplicate: allowDuplicate === true,
      });

      // If duplicate detected and not allowed, return 409
      if (result.isDuplicate && !allowDuplicate) {
        hasDuplicate = true;
        // Get the full show details with venue
        const [showWithVenue] = await getCentralShowsByIds([result.centralShow.id]);
        
        return NextResponse.json(
          {
            error: "Duplicate show detected",
            isDuplicate: true,
            existingShow: showWithVenue,
          },
          { status: 409 }
        );
      }

      showIds.push(result.centralShow.id);
    }

    // Create user_shows entry with show_ids array
    const newUserShow: Database["public"]["Tables"]["user_shows"]["Insert"] = {
      clerk_user_id: userId,
      show_ids: showIds,
      notes: notes || null,
      rating: rating || null,
      // Legacy fields set to null for new shows
      date: null,
      artists: null,
      venue_id: null,
      venue: null,
      city: null,
      state: null,
      country: null,
    };

    // Insert into database
    const supabase = await createClient();
    const { data: userShow, error } = await supabase
      .from("user_shows")
      .insert(newUserShow as any)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create show" },
        { status: 500 }
      );
    }

    // Fetch the complete user show with central shows and venue data
    const showsWithVenues = await getCentralShowsByIds(showIds);

    // Cast userShow to proper type to avoid TypeScript errors
    const typedUserShow = userShow as {
      id: string;
      clerk_user_id: string;
      show_ids: string[];
      notes: string | null;
      rating: string | null;
      created_at: string;
      updated_at: string;
    };

    return NextResponse.json(
      {
        id: typedUserShow.id,
        clerk_user_id: typedUserShow.clerk_user_id,
        show_ids: typedUserShow.show_ids,
        notes: typedUserShow.notes,
        rating: typedUserShow.rating,
        created_at: typedUserShow.created_at,
        updated_at: typedUserShow.updated_at,
        shows: showsWithVenues,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating show:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
