import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();

  // Upsert (insert or update)
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        clerk_user_id: userId,
        ...body,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_user_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  return NextResponse.json(data);
}
