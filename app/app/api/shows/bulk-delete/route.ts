import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Chunk array into smaller batches to avoid URI length limits
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { showIds } = body;

    // Validate input
    if (!showIds || !Array.isArray(showIds) || showIds.length === 0) {
      return NextResponse.json(
        { error: "Show IDs array is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Process in batches to avoid URI length limits (max 100 IDs per batch)
    const BATCH_SIZE = 100;
    const batches = chunkArray(showIds, BATCH_SIZE);

    // Verify all shows belong to user (in batches)
    let verifiedCount = 0;
    for (const batch of batches) {
      const { data: showsToDelete, error: fetchError } = await supabase
        .from("shows")
        .select("id")
        .in("id", batch)
        .eq("clerk_user_id", userId);

      if (fetchError) {
        console.error("Database error:", fetchError);
        return NextResponse.json(
          { error: "Failed to verify shows" },
          { status: 500 }
        );
      }

      verifiedCount += showsToDelete?.length || 0;
    }

    // Check if all requested shows belong to the user
    if (verifiedCount !== showIds.length) {
      return NextResponse.json(
        { error: "Some shows not found or unauthorized" },
        { status: 403 }
      );
    }

    // Delete shows (in batches)
    let deletedCount = 0;
    for (const batch of batches) {
      const { error, count } = await supabase
        .from("shows")
        .delete({ count: "exact" })
        .in("id", batch)
        .eq("clerk_user_id", userId);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to delete shows" },
          { status: 500 }
        );
      }

      deletedCount += count || 0;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting shows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
