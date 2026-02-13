import type { OSMSearchResult } from '@/types/venue';

// Nominatim API requires 1 request per second max
const RATE_LIMIT_MS = 1000;
let lastRequestTime = 0;

/**
 * Rate limit helper to ensure we don't exceed 1 request/second to Nominatim API
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const delay = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Search for a venue using OpenStreetMap Nominatim API
 * @param name - Venue name
 * @param city - City name (optional)
 * @param country - Country name (optional)
 * @returns Array of search results, empty if none found
 */
export async function searchVenue(
  name: string,
  city?: string | null,
  country?: string | null
): Promise<OSMSearchResult[]> {
  try {
    // Apply rate limiting
    await rateLimit();

    // Build search query: concatenate all available fields
    const queryParts = [name];
    if (city) queryParts.push(city);
    if (country) queryParts.push(country);
    const query = queryParts.join(', ');

    // Build Nominatim API URL
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    // Make request with proper User-Agent (required by Nominatim)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'showcount-app/1.0 (https://github.com/yourusername/showcount)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.error(`OSM API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const results = await response.json() as OSMSearchResult[];
    return results;
  } catch (error) {
    console.error('Error searching venue in OSM:', error);
    return [];
  }
}

/**
 * Extract city name from OSM address object
 */
export function extractCity(address?: OSMSearchResult['address']): string | null {
  if (!address) return null;
  return address.city || address.town || address.village || null;
}

/**
 * Extract state from OSM address object
 */
export function extractState(address?: OSMSearchResult['address']): string | null {
  if (!address) return null;
  return address.state || null;
}

/**
 * Extract country from OSM address object
 */
export function extractCountry(address?: OSMSearchResult['address']): string | null {
  if (!address) return null;
  return address.country || null;
}
