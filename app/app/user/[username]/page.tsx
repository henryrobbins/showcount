import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ShowsTable from '@/components/ShowsTable';
import { createClient } from '@/lib/supabase/server';
import type { Show } from '@/types/show';

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

  // Fetch shows from Supabase with venue data
  const supabase = await createClient();
  const { data: shows, error } = await supabase
    .from('shows')
    .select(`
      *,
      venues (
        id,
        name,
        city,
        state,
        country,
        latitude,
        longitude
      )
    `)
    .eq('clerk_user_id', user.id)
    .order('date', { ascending: false });

  // Denormalize venue data for backward compatibility
  const userShows = (shows || []).map((show: any) => {
    // If show has a venue_id and venues data, use that
    if (show.venue_id && show.venues) {
      const venue = Array.isArray(show.venues) ? show.venues[0] : show.venues;
      return {
        ...show,
        venue: venue?.name || show.venue || null,
        city: venue?.city || show.city || null,
        state: venue?.state || show.state || null,
        country: venue?.country || show.country || null,
        // Remove the nested venues object from the result
        venues: undefined,
      } as Show;
    }
    // Otherwise use legacy fields
    return show as Show;
  });

  return (
    <main className="min-h-screen bg-white text-black py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="border-2 border-black p-8 mb-8">
          <h1 className="text-4xl font-bold font-mono tracking-wider">
            {displayName}
          </h1>
          <p className="font-mono text-sm mt-2 text-gray-600">
            {userShows.length} shows attended
          </p>
        </div>

        {userShows.length === 0 ? (
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
            <ShowsTable shows={userShows} />
          </>
        )}
      </div>
    </main>
  );
}

export default UserProfilePage;
