import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getOrCreateVenue } from "@/lib/venues";
import type { Database } from "@/types/database";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Validate venue fields: USA requires all four fields
    if (country === "USA" && (!venue || !city || !state)) {
      return NextResponse.json(
        { error: "USA venues require name, city, state, and country" },
        { status: 400 }
      );
    }

    // Update in database
    const supabase = await createClient();

    // First check if the show exists and belongs to the user
    const { data: existingShow, error: fetchError } = await supabase
      .from("shows")
      .select("clerk_user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingShow) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    if ((existingShow as { clerk_user_id: string }).clerk_user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own shows" },
        { status: 403 }
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

    // Update the show with venue_id
    type ShowUpdate = Database["public"]["Tables"]["shows"]["Update"];
    type ShowRow = Database["public"]["Tables"]["shows"]["Row"];

    const updateData: ShowUpdate = {
      date,
      artists,
      venue_id: venueId,
      venue: null, // Legacy fields set to null for edited shows
      city: null,
      state: null,
      country: null,
      notes: notes || null,
    };

    const result = await supabase
      .from("shows")
      .update(updateData as never)
      .eq("id", id)
      .eq("clerk_user_id", userId)
      .select()
      .single();

    const { data, error } = result as { data: ShowRow | null; error: any };

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update show" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error updating show:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Verify show exists and belongs to user
    const { data: existingShow, error: fetchError } = await supabase
      .from("shows")
      .select("clerk_user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingShow) {
      return NextResponse.json(
        { error: "Show not found or unauthorized" },
        { status: 404 }
      );
    }

    if ((existingShow as { clerk_user_id: string }).clerk_user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own shows" },
        { status: 403 }
      );
    }

    // Delete show
    const { error } = await supabase
      .from("shows")
      .delete()
      .eq("id", id)
      .eq("clerk_user_id", userId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete show" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting show:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
