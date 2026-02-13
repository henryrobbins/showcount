import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clerkUserId: string }> }
) {
  const { clerkUserId } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !profile) {
    return NextResponse.json(null, { status: 200 });
  }

  return NextResponse.json(profile);
}
