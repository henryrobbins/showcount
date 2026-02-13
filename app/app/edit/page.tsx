import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { Show } from '@/types/show';

import EditClient from './EditClient';

async function EditPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user's shows from Supabase
  const supabase = await createClient();
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('date', { ascending: false });

  const userShows = (shows || []) as Show[];

  // If no shows, redirect to upload page
  if (userShows.length === 0) {
    redirect('/upload');
  }

  return <EditClient initialShows={userShows} />;
}

export default EditPage;
