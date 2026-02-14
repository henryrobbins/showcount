import { clerkClient } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

import StatsTable from '@/components/StatsTable';
import { createClient } from '@/lib/supabase/server';

interface PlaceStatsPageProps {
  params: Promise<{ username: string }>;
}

async function PlaceStatsPage({ params }: PlaceStatsPageProps) {
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
        <h1 className="text-2xl font-bold font-mono mb-6">Place Statistics</h1>
        <StatsTable title="Cities" headers={['City', 'Shows']} rows={[]} />
        <StatsTable title="States" headers={['State', 'Shows']} rows={[]} />
        <StatsTable title="Countries" headers={['Country', 'Shows']} rows={[]} />
      </div>
    );
  }

  // Collect all show_ids
  const allShowIds = userShows.flatMap((us: any) => us.show_ids || []);

  if (allShowIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono mb-6">Place Statistics</h1>
        <StatsTable title="Cities" headers={['City', 'Shows']} rows={[]} />
        <StatsTable title="States" headers={['State', 'Shows']} rows={[]} />
        <StatsTable title="Countries" headers={['Country', 'Shows']} rows={[]} />
      </div>
    );
  }

  // Fetch all central shows with venue data in batches to avoid URI too long errors
  const BATCH_SIZE = 100;
  const allCentralShows: Array<{ id: string; venues: { city: string | null; state: string | null; country: string | null } | null }> = [];
  
  for (let i = 0; i < allShowIds.length; i += BATCH_SIZE) {
    const batch = allShowIds.slice(i, i + BATCH_SIZE);
    const { data: centralShows } = await supabase
      .from('central_shows')
      .select(`
        id,
        venues:venue_id (city, state, country)
      `)
      .in('id', batch);
    
    if (centralShows) {
      allCentralShows.push(...(centralShows as any));
    }
  }

  // Count by city, state, and country
  const cityCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();

  for (const show of allCentralShows) {
    const venue = show.venues;
    if (!venue) continue;

    if (venue.city) {
      cityCounts.set(venue.city, (cityCounts.get(venue.city) || 0) + 1);
    }
    if (venue.state) {
      stateCounts.set(venue.state, (stateCounts.get(venue.state) || 0) + 1);
    }
    if (venue.country) {
      countryCounts.set(venue.country, (countryCounts.get(venue.country) || 0) + 1);
    }
  }

  // Convert to sorted arrays
  const sortedCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => [city, count]);

  const sortedStates = Array.from(stateCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([state, count]) => [state, count]);

  const sortedCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => [country, count]);

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono mb-6">Place Statistics</h1>
      <StatsTable title="Cities" headers={['City', 'Shows']} rows={sortedCities} />
      {sortedStates.length > 0 && (
        <StatsTable title="States" headers={['State', 'Shows']} rows={sortedStates} />
      )}
      {sortedCountries.length > 0 && (
        <StatsTable title="Countries" headers={['Country', 'Shows']} rows={sortedCountries} />
      )}
    </div>
  );
}

export default PlaceStatsPage;
