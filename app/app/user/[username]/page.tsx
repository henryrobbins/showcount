import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BasicStats from '@/components/BasicStats';
import ShowsTable from '@/components/ShowsTable';
import UserProfileSection from '@/components/UserProfileSection';
import { createClient } from '@/lib/supabase/server';
import type { UserShowWithDetails } from '@/types/show';
import type { UserProfile } from '@/types/profile';

// Increase timeout for profile pages with many shows
export const maxDuration = 60;

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
  // Collect all show_ids from all user_shows to fetch in batched queries
  const allShowIds = (userShows || [])
    .flatMap((show: any) => show.show_ids || [])
    .filter((id): id is string => !!id);

  // Fetch all central shows with venue data in BATCHED queries to avoid URL length limits
  const centralShowsMap = new Map<string, any>();
  
  if (allShowIds.length > 0) {
    // Batch IDs to avoid URL length limits (PostgreSQL UUID is 36 chars + separators)
    // Safe batch size of 100 IDs keeps URL under 8KB
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < allShowIds.length; i += BATCH_SIZE) {
      const batch = allShowIds.slice(i, i + BATCH_SIZE);
      
      const { data: centralShows, error: centralError } = await supabase
        .from('central_shows')
        .select(`
          *,
          venues:venue_id (*)
        `)
        .in('id', batch);

      if (centralError) {
        console.error('Error fetching central shows batch:', centralError);
      } else if (centralShows) {
        // Add to map for quick lookup
        for (const cs of centralShows) {
          centralShowsMap.set((cs as any).id, cs);
        }
      }
    }
  }

  const transformedShows: UserShowWithDetails[] = [];

  for (const userShow of (userShows || []) as Array<{
    id: string;
    clerk_user_id: string;
    show_ids: string[];
    notes: string | null;
    rating: string | null;
    created_at: string;
    updated_at: string;
  }>) {
    if (!userShow.show_ids || userShow.show_ids.length === 0) {
      continue;
    }

    // Get central shows from the map instead of querying
    const centralShows = userShow.show_ids
      .map(id => centralShowsMap.get(id))
      .filter((cs): cs is any => !!cs);

    if (centralShows.length === 0) {
      continue;
    }

    // Transform to UserShowWithDetails
    transformedShows.push({
      id: userShow.id,
      clerk_user_id: userShow.clerk_user_id,
      show_ids: userShow.show_ids,
      notes: userShow.notes,
      rating: userShow.rating,
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

  // Extract rating system config if ratings are enabled
  const ratingSystemConfig =
    userProfile?.ratings_enabled && userProfile?.rating_system_config
      ? userProfile.rating_system_config
      : null;

  // Calculate basic statistics
  const stats = {
    totalShows: transformedShows.length,
    uniqueArtists: new Set(transformedShows.flatMap(s => s.shows.map(cs => cs.artist))).size,
    uniqueVenues: new Set(transformedShows.flatMap(s => s.shows.map(cs => cs.venue?.name).filter(Boolean))).size,
    uniqueCities: new Set(transformedShows.flatMap(s => s.shows.map(cs => cs.venue?.city).filter(Boolean))).size,
    uniqueStates: new Set(transformedShows.flatMap(s => s.shows.map(cs => cs.venue?.state).filter(Boolean))).size,
    uniqueCountries: new Set(transformedShows.flatMap(s => s.shows.map(cs => cs.venue?.country).filter(Boolean))).size,
  };

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
            <BasicStats
              totalShows={stats.totalShows}
              uniqueArtists={stats.uniqueArtists}
              uniqueVenues={stats.uniqueVenues}
              uniqueCities={stats.uniqueCities}
              uniqueStates={stats.uniqueStates}
              uniqueCountries={stats.uniqueCountries}
            />

            <div className="mb-4 flex gap-4 font-mono text-sm">
              <Link href={`/user/${username}/stats/artists`} className="underline hover:no-underline">
                Artist Stats
              </Link>
              <Link href={`/user/${username}/stats/venues`} className="underline hover:no-underline">
                Venue Stats
              </Link>
              <Link href={`/user/${username}/stats/places`} className="underline hover:no-underline">
                Place Stats
              </Link>
              <Link href={`/user/${username}/stats/dates`} className="underline hover:no-underline">
                Date Stats
              </Link>
            </div>

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
            <ShowsTable shows={transformedShows} ratingSystemConfig={ratingSystemConfig} />
          </>
        )}
      </div>
    </main>
  );
}

export default UserProfilePage;
