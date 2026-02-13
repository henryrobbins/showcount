import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { ShowInsert } from '@/types/show';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shows } = body as { shows: ShowInsert[] };

    if (!shows || !Array.isArray(shows) || shows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: shows array required' },
        { status: 400 }
      );
    }

    for (const show of shows) {
      if (show.clerk_user_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: cannot insert shows for other users' },
          { status: 403 }
        );
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('shows')
      .insert(shows as any)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save shows to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      shows: data,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
