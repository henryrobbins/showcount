import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    const { date, artists, venue, city, state, country, notes } = body;

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

    // Validate venue fields: USA requires all three fields
    if (country === "USA" && (!venue || !city)) {
      return NextResponse.json(
        { error: "USA venues require name, city, and country" },
        { status: 400 }
      );
    }

    // Get or create venue if venue name is provided
    let venueId: string | null = null;
    if (venue) {
      venueId = await getOrCreateVenue({
        name: venue,
        city: city || null,
        country: country || null,
      });
    }

    // Create show object with venue_id
    const newShow: Database["public"]["Tables"]["shows"]["Insert"] = {
      clerk_user_id: userId,
      date,
      artists,
      venue_id: venueId,
      venue: null, // Legacy fields set to null for new shows
      city: null,
      state: null,
      country: null,
      notes: notes || null,
    };

    // Insert into database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shows")
      .insert(newShow as any)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create show" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating show:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
