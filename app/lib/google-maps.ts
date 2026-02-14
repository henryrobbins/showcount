import type { VenueSearchParams, GoogleMapsGeocodingResult } from '@/types/venue';

/**
 * Geocode a venue using Google Maps Geocoding API
 * Handles misspellings and partial matches
 */
export async function geocodeVenue(
  params: VenueSearchParams
): Promise<GoogleMapsGeocodingResult[]> {
  // Build address string from venue params
  const addressParts = [
    params.name,
    params.city,
    params.state,
    params.country
  ].filter(Boolean);
  
  const address = addressParts.join(', ');
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }
  
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);
  
  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    
    if (!response.ok) {
      console.error(`Google Geocoding API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`Geocoding API status: ${data.status}`, data.error_message);
      return [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error('Error geocoding venue:', error);
    return [];
  }
}

/**
 * Extract city from address components
 */
export function extractCity(addressComponents: GoogleMapsGeocodingResult['address_components']): string | null {
  const city = addressComponents.find(c => 
    c.types.includes('locality') || 
    c.types.includes('sublocality')
  );
  return city?.long_name || null;
}

/**
 * Extract state from address components
 */
export function extractState(addressComponents: GoogleMapsGeocodingResult['address_components']): string | null {
  const state = addressComponents.find(c => 
    c.types.includes('administrative_area_level_1')
  );
  return state?.short_name || state?.long_name || null;
}

/**
 * Extract country from address components
 */
export function extractCountry(addressComponents: GoogleMapsGeocodingResult['address_components']): string {
  const country = addressComponents.find(c => c.types.includes('country'));
  return country?.long_name || 'Unknown';
}
