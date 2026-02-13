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

  // Fetch shows from Supabase
  const supabase = await createClient();
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')
    .eq('clerk_user_id', user.id)
    .order('date', { ascending: false });

  const userShows = (shows || []) as Show[];

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
