import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, artists, venue, city, state, country } = body;

    // Validate required fields
    if (!date || !artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json(
        { error: "Date and at least one artist are required" },
        { status: 400 }
      );
    }

    // Create show object
    const newShow: Database["public"]["Tables"]["shows"]["Insert"] = {
      clerk_user_id: userId,
      date,
      artists,
      venue: venue || null,
      city: city || null,
      state: state || null,
      country: country || null,
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
