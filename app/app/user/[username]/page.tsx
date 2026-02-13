import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ShowsTable from '@/components/ShowsTable';
import UserProfileSection from '@/components/UserProfileSection';
import { createClient } from '@/lib/supabase/server';
import type { UserShowWithDetails } from '@/types/show';
import type { UserProfile } from '@/types/profile';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;

  // Fetch user by username from Clerk
  const client = await clerkClient();
  const users = await client.users.getUserList({ username: [username] });

  if (users.data.length === 0) {
    notFound();
  }

  const user = users.data[0];
  const displayName = user.username || 'User';

  // Get current authenticated user
  const { userId: currentUserId } = await auth();
  const isOwnProfile = currentUserId === user.id;

  // Fetch user profile
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', user.id)
    .single();

  const userProfile = profile as UserProfile | null;

  // Fetch user_shows with joined central_shows and venues
  const { data: userShows, error } = await supabase
    .from('user_shows')
    .select(`
      *
    `)
    .eq('clerk_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user shows:', error);
  }

  // Transform the data to UserShowWithDetails format
  // We need to manually fetch central shows because Supabase doesn't support array joins well
  const transformedShows: UserShowWithDetails[] = [];

  for (const userShow of (userShows || []) as Array<{
    id: string;
    clerk_user_id: string;
    show_ids: string[];
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>) {
    if (!userShow.show_ids || userShow.show_ids.length === 0) {
      continue;
    }

    // Fetch central shows with venue data for this user show
    const { data: centralShows, error: centralError } = await supabase
      .from('central_shows')
      .select(`
        *,
        venues:venue_id (*)
      `)
      .in('id', userShow.show_ids);

    if (centralError) {
      console.error('Error fetching central shows:', centralError);
      continue;
    }

    // Transform to UserShowWithDetails
    transformedShows.push({
      id: userShow.id,
      clerk_user_id: userShow.clerk_user_id,
      show_ids: userShow.show_ids,
      notes: userShow.notes,
      created_at: userShow.created_at,
      updated_at: userShow.updated_at,
      shows: centralShows.map((cs: any) => ({
        id: cs.id,
        show_id: cs.show_id,
        date: cs.date,
        artist: cs.artist,
        venue_id: cs.venue_id,
        created_at: cs.created_at,
        updated_at: cs.updated_at,
        venue: cs.venues,
      })),
    });
  }

  // Sort by date (use first show's date)
  transformedShows.sort((a, b) => {
    const dateA = a.shows[0]?.date || '';
    const dateB = b.shows[0]?.date || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <main className="min-h-screen bg-white text-black py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <UserProfileSection
          profile={userProfile}
          userEmail={user.emailAddresses?.[0]?.emailAddress || null}
          isOwnProfile={isOwnProfile}
          displayName={displayName}
          showCount={transformedShows.length}
        />

        {transformedShows.length === 0 ? (
          <div className="border border-black p-8 text-center">
            <p className="font-mono text-lg mb-4">
              {isOwnProfile
                ? "You haven't imported any show data yet."
                : "This user hasn't imported any show data yet."}
            </p>
            {isOwnProfile && (
              <Link
                href="/upload"
                className="inline-block px-6 py-3 border-2 border-black bg-black 
                         text-white font-mono hover:bg-gray-800"
              >
                Import Show Data
              </Link>
            )}
          </div>
        ) : (
          <>
            {isOwnProfile && (
              <div className="mb-4 flex justify-end gap-4">
                <Link
                  href="/edit"
                  className="px-4 py-2 border border-black bg-white text-black 
                           font-mono hover:bg-gray-100"
                >
                  Edit Shows
                </Link>
                <Link
                  href="/upload"
                  className="px-4 py-2 border border-black bg-white text-black 
                           font-mono hover:bg-gray-100"
                >
                  Import More Shows
                </Link>
              </div>
            )}
            <ShowsTable shows={transformedShows} />
          </>
        )}
      </div>
    </main>
  );
}

export default UserProfilePage;
