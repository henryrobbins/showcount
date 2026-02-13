import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
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

    const supabase = await createClient();

    // Verify show exists and belongs to user
    const { data: existingShow, error: fetchError } = await supabase
      .from("shows")
      .select("*")
      .eq("id", id)
      .eq("clerk_user_id", userId)
      .single();

    if (fetchError || !existingShow) {
      return NextResponse.json(
        { error: "Show not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update show
    const updateData: Database["public"]["Tables"]["shows"]["Update"] = {
      date,
      artists,
      venue: venue || null,
      city: city || null,
      state: state || null,
      country: country || null,
    };

    const { data, error } = await supabase
      .from("shows")
      .update(updateData)
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating show:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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
      .select("*")
      .eq("id", id)
      .eq("clerk_user_id", userId)
      .single();

    if (fetchError || !existingShow) {
      return NextResponse.json(
        { error: "Show not found or unauthorized" },
        { status: 404 }
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
