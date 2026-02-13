import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { showIds } = body;

    // Validate input
    if (!showIds || !Array.isArray(showIds) || showIds.length === 0) {
      return NextResponse.json(
        { error: 'Show IDs array is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify all shows belong to user
    const { data: showsToDelete, error: fetchError } = await supabase
      .from('shows')
      .select('id')
      .in('id', showIds)
      .eq('clerk_user_id', userId);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify shows' },
        { status: 500 }
      );
    }

    // Check if all requested shows belong to the user
    if (!showsToDelete || showsToDelete.length !== showIds.length) {
      return NextResponse.json(
        { error: 'Some shows not found or unauthorized' },
        { status: 403 }
      );
    }

    // Delete shows
    const { error } = await supabase
      .from('shows')
      .delete()
      .in('id', showIds)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete shows' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: showIds.length,
    });
  } catch (error) {
    console.error('Error bulk deleting shows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
