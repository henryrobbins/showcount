import { clerkClient } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

import StatsTable from '@/components/StatsTable';
import { createClient } from '@/lib/supabase/server';

interface ArtistStatsPageProps {
  params: Promise<{ username: string }>;
}

async function ArtistStatsPage({ params }: ArtistStatsPageProps) {
  const { username } = await params;

  // Fetch user by username from Clerk
  const client = await clerkClient();
  const users = await client.users.getUserList({ username: [username] });

  if (users.data.length === 0) {
    notFound();
  }

  const user = users.data[0];

  // Fetch user_shows with joined central_shows
  const supabase = await createClient();
  const { data: userShows } = await supabase
    .from('user_shows')
    .select('show_ids')
    .eq('clerk_user_id', user.id);

  if (!userShows || userShows.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono mb-6">Artist Statistics</h1>
        <StatsTable title="Artists" headers={['Artist', 'Shows']} rows={[]} />
      </div>
    );
  }

  // Collect all show_ids
  const allShowIds = userShows.flatMap((us) => us.show_ids || []);

  if (allShowIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono mb-6">Artist Statistics</h1>
        <StatsTable title="Artists" headers={['Artist', 'Shows']} rows={[]} />
      </div>
    );
  }

  // Fetch all central shows
  const { data: centralShows } = await supabase
    .from('central_shows')
    .select('artist')
    .in('id', allShowIds);

  // Count shows per artist
  const artistCounts = new Map<string, number>();
  for (const show of centralShows || []) {
    const count = artistCounts.get(show.artist) || 0;
    artistCounts.set(show.artist, count + 1);
  }

  // Convert to sorted array
  const sortedArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([artist, count]) => [artist, count]);

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono mb-6">Artist Statistics</h1>
      <StatsTable title="Artists" headers={['Artist', 'Shows']} rows={sortedArtists} />
    </div>
  );
}

export default ArtistStatsPage;
