import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Update all user_shows to set rating to null
    const { error } = await supabase
      .from("user_shows")
      .update({ rating: null })
      .eq("clerk_user_id", userId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to clear ratings" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "All ratings cleared" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing ratings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
