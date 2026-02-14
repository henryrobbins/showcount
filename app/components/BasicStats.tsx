interface BasicStatsProps {
  totalShows: number;
  uniqueArtists: number;
  uniqueVenues: number;
  uniqueCities: number;
  uniqueStates: number;
  uniqueCountries: number;
}

export default function BasicStats({
  totalShows,
  uniqueArtists,
  uniqueVenues,
  uniqueCities,
  uniqueStates,
  uniqueCountries,
}: BasicStatsProps) {
  return (
    <div className="border border-black p-4 mb-4 font-mono text-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <span>{totalShows} shows</span>
        <span className="text-gray-400">|</span>
        <span>{uniqueArtists} artists</span>
        <span className="text-gray-400">|</span>
        <span>{uniqueVenues} venues</span>
        <span className="text-gray-400">|</span>
        <span>{uniqueCities} cities</span>
        {uniqueStates > 0 && (
          <>
            <span className="text-gray-400">|</span>
            <span>{uniqueStates} states</span>
          </>
        )}
        {uniqueCountries > 0 && (
          <>
            <span className="text-gray-400">|</span>
            <span>{uniqueCountries} countries</span>
          </>
        )}
      </div>
    </div>
  );
}
