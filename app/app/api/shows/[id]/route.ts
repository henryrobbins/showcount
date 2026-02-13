import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
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
    const { date, artists, venue, city, state, country } = body;

    // Validate required fields
    if (!date || !artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json(
        { error: "Date and at least one artist are required" },
        { status: 400 }
      );
    }

    // Create show update object
    const updatedShow: Database["public"]["Tables"]["shows"]["Update"] = {
      date,
      artists,
      venue: venue || null,
      city: city || null,
      state: state || null,
      country: country || null,
    };

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

    if (existingShow.clerk_user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own shows" },
        { status: 403 }
      );
    }

    // Update the show
    const { data, error } = await supabase
      .from("shows")
      .update(updatedShow as any)
      .eq("id", id)
      .eq("clerk_user_id", userId)
      .select()
      .single();

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
