import type { Show } from '@/types/show';

interface ShowsTableProps {
  shows: Show[];
}

export default function ShowsTable({ shows }: ShowsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const sortedShows = [...shows].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="w-full border border-black">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left p-3 border-r border-black">Date</th>
            <th className="text-left p-3 border-r border-black">Artists</th>
            <th className="text-left p-3 border-r border-black">Venue</th>
            <th className="text-left p-3 border-r border-black">City</th>
            <th className="text-left p-3 border-r border-black">State</th>
            <th className="text-left p-3">Country</th>
          </tr>
        </thead>
        <tbody>
          {sortedShows.map((show) => (
            <tr key={show.id} className="border-b border-black last:border-b-0">
              <td className="p-3 border-r border-black whitespace-nowrap">
                {formatDate(show.date)}
              </td>
              <td className="p-3 border-r border-black">
                {show.artists.map((artist) => (
                  <div key={artist}>{artist}</div>
                ))}
              </td>
              <td className="p-3 border-r border-black">{show.venue || '-'}</td>
              <td className="p-3 border-r border-black">{show.city || '-'}</td>
              <td className="p-3 border-r border-black">{show.state || '-'}</td>
              <td className="p-3">{show.country || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
