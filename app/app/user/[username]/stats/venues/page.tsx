import { clerkClient } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

import StatsTable from '@/components/StatsTable';
import { createClient } from '@/lib/supabase/server';

interface VenueStatsPageProps {
  params: Promise<{ username: string }>;
}

async function VenueStatsPage({ params }: VenueStatsPageProps) {
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
        <h1 className="text-2xl font-bold font-mono mb-6">Venue Statistics</h1>
        <StatsTable title="Venues" headers={['Venue', 'City', 'Shows']} rows={[]} />
      </div>
    );
  }

  // Collect all show_ids
  const allShowIds = userShows.flatMap((us) => us.show_ids || []);

  if (allShowIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono mb-6">Venue Statistics</h1>
        <StatsTable title="Venues" headers={['Venue', 'City', 'Shows']} rows={[]} />
      </div>
    );
  }

  // Fetch all central shows with venue data
  const { data: centralShows } = await supabase
    .from('central_shows')
    .select(`
      venue_id,
      venues:venue_id (name, city)
    `)
    .in('id', allShowIds);

  // Count shows per venue (with city for disambiguation)
  const venueCountsMap = new Map<string, { name: string; city: string; count: number }>();
  
  for (const show of centralShows || []) {
    const venue = (show as any).venues;
    if (!venue || !venue.name) continue;

    // Use venue_id as key for uniqueness
    const key = (show as any).venue_id;
    const existing = venueCountsMap.get(key);
    
    if (existing) {
      existing.count++;
    } else {
      venueCountsMap.set(key, {
        name: venue.name,
        city: venue.city || '-',
        count: 1,
      });
    }
  }

  // Convert to sorted array
  const sortedVenues = Array.from(venueCountsMap.values())
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .map((v) => [v.name, v.city, v.count]);

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono mb-6">Venue Statistics</h1>
      <StatsTable title="Venues" headers={['Venue', 'City', 'Shows']} rows={sortedVenues} />
    </div>
  );
}

export default VenueStatsPage;
