---
name: Google Maps API Migration
overview: "Migrate from OpenStreetMap to Google Maps Platform APIs: Geocoding API for bulk CSV uploads and Places UI Kit for improved manual show entry with autocomplete venue selection."
todos:
  - id: setup-gcp-apis
    content: Enable Google Maps APIs in GCP Console (Geocoding, Places, Maps JavaScript) and create API keys with restrictions
    status: pending
  - id: terraform-config
    content: Add Google Maps API key variables and Vercel environment variables to Terraform configuration
    status: pending
  - id: database-migration
    content: Create and apply Supabase migration to add google_place_id and google_formatted_address columns to venues table
    status: pending
  - id: backend-geocoding
    content: Implement Google Maps Geocoding API integration in app/lib/google-maps.ts with address component extraction
    status: pending
  - id: update-venue-creation
    content: Update app/lib/venues.ts to use Google Maps Geocoding instead of OSM for new venues
    status: pending
  - id: update-types
    content: Update TypeScript types in app/types/venue.ts and app/types/database.ts for Google Maps fields
    status: pending
  - id: maps-script-loader
    content: Add Google Maps JavaScript API loader to app/app/layout.tsx
    status: pending
  - id: venue-autocomplete-component
    content: Create VenueAutocomplete component using Places UI Kit in app/components/VenueAutocomplete.tsx
    status: pending
  - id: update-show-forms
    content: Replace manual venue/city/state/country fields with VenueAutocomplete in show entry forms
    status: pending
  - id: env-examples
    content: Update app/.env.example with Google Maps API key placeholders and documentation
    status: pending
  - id: test-csv-upload
    content: Test CSV upload with various venue names (exact, misspelled, partial matches)
    status: pending
  - id: test-manual-entry
    content: Test manual show entry with autocomplete venue selection
    status: pending
  - id: deploy-terraform
    content: Apply Terraform changes to provision API keys in production environment
    status: pending
  - id: monitor-costs
    content: Set up monitoring for Google Maps API usage and costs in GCP Console
    status: pending
isProject: false
---

# Google Maps API Migration Plan

## Overview

Replace OpenStreetMap Nominatim API (1 req/sec rate limit) with Google Maps Platform to improve geocoding reliability and user experience:

- **Geocoding API**: Batch processing of venue names during CSV uploads
- **Places UI Kit Autocomplete**: Replace manual venue/city/state/country fields with autocomplete venue picker
- **Infrastructure**: Terraform-managed API keys with proper security

## Current State

**OSM Implementation** (`[app/lib/osm.ts](app/lib/osm.ts)`):

- Rate limiting: 1 request per second
- Used by: `[app/lib/venues.ts](app/lib/venues.ts)` `createVenueFromOSM()` and `getOrCreateVenueWithStatus()`
- Called from: Upload endpoints and show creation/update API routes
- Returns: lat/lon, display_name, address components
- Stored fields: `osm_place_id`, `osm_display_name`, `latitude`, `longitude`

**Manual Entry** (various show forms):

- Separate text inputs for venue name, city, state, country
- No autocomplete or validation
- Prone to typos and inconsistent formatting

## Migration Strategy

### Phase 1: Infrastructure Setup

**Terraform Configuration** (`[infra/main.tf](infra/main.tf)`, `[infra/variables.tf](infra/variables.tf)`):

1. Add Google Maps API key variable (sensitive)
2. Create Vercel environment variables for:
  - `GOOGLE_MAPS_API_KEY` (server-only, for Geocoding API)
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side, for Places UI Kit)
3. Update `.env.example` files

**Google Cloud Setup**:

- Enable Geocoding API
- Enable Places API (new)
- Enable Maps JavaScript API
- Create API key(s) with appropriate restrictions:
  - Server key: HTTP referrer or IP restrictions
  - Client key: HTTP referrer restrictions for your domains

**Pattern** (following existing conventions):

```hcl
variable "google_maps_api_key" {
  description = "Google Maps Platform API key (server-side)"
  type        = string
  sensitive   = true
}

variable "google_maps_api_key_client" {
  description = "Google Maps Platform API key (client-side)"
  type        = string
  sensitive   = true
}

resource "vercel_project_environment_variable" "google_maps_api_key" {
  project_id = vercel_project.showcount.id
  key        = "GOOGLE_MAPS_API_KEY"
  value      = var.google_maps_api_key
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "google_maps_api_key_client" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
  value      = var.google_maps_api_key_client
  target     = ["production", "preview"]
  sensitive  = true
}
```

### Phase 2: Backend - Geocoding API Integration

**Create New Geocoding Module** (`[app/lib/google-maps.ts](app/lib/google-maps.ts)`):

```typescript
import type { VenueSearchParams } from '@/types/venue';

export interface GoogleMapsGeocodingResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  partial_match?: boolean;
}

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
```

**Update Venue Creation** (`[app/lib/venues.ts](app/lib/venues.ts)`):

```typescript
import { geocodeVenue, extractCity, extractState, extractCountry } from './google-maps';
import type { GoogleMapsGeocodingResult } from './google-maps';

async function createVenueFromGoogleMaps(
  supabase: SupabaseClient<Database>,
  name: string,
  city: string | null | undefined,
  state: string | null | undefined,
  country: string | null | undefined,
  geocodeResult: GoogleMapsGeocodingResult
): Promise<string | null> {
  try {
    const venueData: VenueInsert = {
      name,
      city: city || extractCity(geocodeResult.address_components),
      state: state || extractState(geocodeResult.address_components),
      country: country || extractCountry(geocodeResult.address_components),
      latitude: geocodeResult.geometry.location.lat,
      longitude: geocodeResult.geometry.location.lng,
      google_place_id: geocodeResult.place_id,
      google_formatted_address: geocodeResult.formatted_address,
    };
    
    const { data, error } = await supabase
      .from('venues')
      .insert(venueData)
      .select('id')
      .single();
      
    if (error) {
      console.error('Error creating venue:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in createVenueFromGoogleMaps:', error);
    return null;
  }
}

export async function getOrCreateVenueWithStatus(
  supabase: SupabaseClient<Database>,
  name: string,
  city?: string | null,
  state?: string | null,
  country?: string | null
): Promise<{ venueId: string | null; status: VenueCreationStatus }> {
  // ... existing venue lookup logic ...
  
  // If not found, try geocoding with Google Maps
  const geocodeResults = await geocodeVenue({ name, city, state, country });
  
  if (geocodeResults.length === 0) {
    // Fallback: create venue without coordinates
    const venueId = await createVenueWithoutGeocode(supabase, name, city, state, country);
    return { 
      venueId, 
      status: venueId ? 'created_without_geocode' : 'failed' 
    };
  }
  
  const topResult = geocodeResults[0];
  
  // Check if partial match - could log warning
  if (topResult.partial_match) {
    console.warn(`Partial match for venue: ${name}`, topResult.formatted_address);
  }
  
  const venueId = await createVenueFromGoogleMaps(
    supabase, 
    name, 
    city, 
    state, 
    country, 
    topResult
  );
  
  return { 
    venueId, 
    status: venueId ? 'created_with_geocode' : 'failed' 
  };
}
```

**Database Schema Updates** (`[infra/supabase/migrations/](infra/supabase/migrations/)`):

Create migration to add Google Maps fields:

```sql
-- Add Google Maps fields to venues table
ALTER TABLE venues 
  ADD COLUMN google_place_id TEXT,
  ADD COLUMN google_formatted_address TEXT;

-- Create index on google_place_id for lookups
CREATE INDEX idx_venues_google_place_id ON venues(google_place_id);

-- Keep OSM fields for backward compatibility during transition
-- osm_place_id and osm_display_name remain nullable
```

**Update TypeScript Types** (`[app/types/database.ts](app/types/database.ts)`, `[app/types/venue.ts](app/types/venue.ts)`):

```typescript
export interface GoogleMapsSearchResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  partial_match?: boolean;
}

// Update venues table Row type
venues: {
  Row: {
    // ... existing fields ...
    google_place_id: string | null;
    google_formatted_address: string | null;
    osm_place_id: string | null; // Keep for backward compatibility
    osm_display_name: string | null;
  };
}
```

### Phase 3: Frontend - Places UI Kit Integration

**Load Google Maps JavaScript API** (`[app/app/layout.tsx](app/app/layout.tsx)`):

Add to the `<head>`:

```tsx
<script
  async
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
/>
```

**Create Venue Autocomplete Component** (`[app/components/VenueAutocomplete.tsx](app/components/VenueAutocomplete.tsx)`):

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface VenueAutocompleteProps {
  onSelect: (place: {
    name: string;
    city: string | null;
    state: string | null;
    country: string;
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialValue?: string;
  className?: string;
}

export function VenueAutocomplete({ 
  onSelect, 
  initialValue = '',
  className = '' 
}: VenueAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!window.google?.maps?.places) {
      setError('Google Maps not loaded');
      return;
    }
    
    if (!inputRef.current) return;
    
    // Initialize Places Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'], // Focus on venues/businesses
      fields: ['place_id', 'name', 'formatted_address', 'address_components', 'geometry'],
    });
    
    // Listen for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        setError('No details available for input');
        return;
      }
      
      // Extract address components
      const getComponent = (types: string[]) => 
        place.address_components?.find(c => 
          types.some(t => c.types.includes(t))
        );
      
      const city = getComponent(['locality', 'sublocality'])?.long_name || null;
      const state = getComponent(['administrative_area_level_1'])?.short_name || null;
      const country = getComponent(['country'])?.long_name || 'Unknown';
      
      onSelect({
        name: place.name || '',
        city,
        state,
        country,
        placeId: place.place_id || '',
        formattedAddress: place.formatted_address || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      });
      
      setError(null);
    });
    
    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [onSelect]);
  
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={initialValue}
        placeholder="Search for a venue..."
        className={className}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
```

**Update Show Entry Forms**:

Replace the separate venue/city/state/country fields with the autocomplete component.

Example for manual show entry (`[app/app/shows/new/page.tsx](app/app/shows/new/page.tsx)` or similar):

```tsx
'use client';

import { VenueAutocomplete } from '@/components/VenueAutocomplete';
import { useState } from 'react';

export default function NewShowForm() {
  const [venueData, setVenueData] = useState<{
    name: string;
    city: string | null;
    state: string | null;
    country: string;
    placeId: string;
  } | null>(null);
  
  const handleVenueSelect = (place: {
    name: string;
    city: string | null;
    state: string | null;
    country: string;
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  }) => {
    setVenueData({
      name: place.name,
      city: place.city,
      state: place.state,
      country: place.country,
      placeId: place.placeId,
    });
    
    // Optionally display the formatted address for confirmation
    console.log('Selected venue:', place.formattedAddress);
  };
  
  return (
    <form>
      {/* Other form fields... */}
      
      <div>
        <label>Venue</label>
        <VenueAutocomplete 
          onSelect={handleVenueSelect}
          className="w-full px-3 py-2 border rounded-md"
        />
        
        {/* Show selected venue info */}
        {venueData && (
          <div className="mt-2 text-sm text-gray-600">
            {venueData.name}
            {venueData.city && `, ${venueData.city}`}
            {venueData.state && `, ${venueData.state}`}
            {venueData.country && ` ${venueData.country}`}
          </div>
        )}
      </div>
      
      {/* Rest of form... */}
    </form>
  );
}
```

**API Route for Place Details** (`[app/app/api/venues/place-details/route.ts](app/app/api/venues/place-details/route.ts)`):

When submitting a form with a Place ID, optionally create a dedicated endpoint to fetch full place details:

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');
  
  if (!placeId) {
    return NextResponse.json({ error: 'placeId required' }, { status: 400 });
  }
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,address_components,geometry');
  url.searchParams.set('key', apiKey!);
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (data.status !== 'OK') {
    return NextResponse.json({ error: data.status }, { status: 400 });
  }
  
  return NextResponse.json(data.result);
}
```

### Phase 4: Testing & Validation

**Unit Tests**:

- Test `geocodeVenue()` with various inputs (exact, misspelled, partial)
- Test address component extraction functions
- Test venue creation with Google Maps data

**Integration Tests**:

- CSV upload with various venue formats
- Manual show entry with autocomplete
- Verify proper storage of Google Maps data

**Data Quality Checks**:

- Compare geocoding results between OSM and Google Maps for sample data
- Check for venues that fail geocoding (fallback behavior)
- Verify `partial_match` flag handling

### Phase 5: Deployment & Monitoring

**Rollout Strategy**:

1. Deploy infrastructure changes (Terraform)
2. Deploy database migration
3. Deploy backend code changes
4. Deploy frontend changes
5. Monitor error rates and API costs

**Monitoring**:

- Track Google Maps API usage and costs
- Log geocoding failures and partial matches
- Monitor venue creation success rates
- Alert on API quota limits

**Cost Optimization**:

- Cache geocoding results by venue name/location
- Implement request deduplication for CSV uploads
- Consider batch geocoding for large uploads

### Phase 6: Cleanup (Optional)

Once validated and stable:

- Remove OSM-specific code (`[app/lib/osm.ts](app/lib/osm.ts)`)
- Drop `osm_place_id` and `osm_display_name` columns (or keep for historical data)
- Update documentation

## Data Migration Considerations

**Existing Venues**:

- Keep existing OSM data intact (no re-geocoding needed)
- New venues use Google Maps
- Database supports both OSM and Google Maps fields

**Dual Support Period**:

- Old venues: Use OSM fields if present
- New venues: Use Google Maps fields
- Display logic checks for presence of either field set

## API Usage & Cost Estimates

**Geocoding API** (Essentials tier):

- $5 per 1,000 requests
- CSV uploads: Sequential processing (1 venue per show)
- Typical upload: 100 shows = 100 geocoding calls = $0.50

**Places UI Kit Autocomplete** (Essentials tier):

- $2.83 per 1,000 sessions
- Session = user starts typing → selects a place
- Typical user: 1-5 venues per session

**Cost Comparison**:

- OSM: Free but unreliable (1 req/sec limit, lower quality)
- Google Maps: Paid but reliable, better UX, faster

## Environment Variables Summary

**Production** (via Terraform):

- `GOOGLE_MAPS_API_KEY` (server-side, sensitive)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side, restricted)

**Local Development** (`[app/.env](app/.env)`):

```bash
GOOGLE_MAPS_API_KEY=your_server_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_client_key_here
```

**Example file** (`[app/.env.example](app/.env.example)`):

```bash
# Google Maps Platform API Keys
# Get these from: https://console.cloud.google.com/google/maps-apis
# Enable: Geocoding API, Places API (new), Maps JavaScript API
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Files to Create/Modify

### Infrastructure

- `infra/variables.tf` - Add Google Maps API key variables
- `infra/main.tf` - Add Vercel env vars
- `infra/terraform.tfvars.example` - Add example values
- `infra/supabase/migrations/XXX_add_google_maps_fields.sql` - New migration

### Backend

- `app/lib/google-maps.ts` - **New** Google Maps integration
- `app/lib/venues.ts` - Update to use Google Maps
- `app/types/venue.ts` - Add Google Maps types
- `app/types/database.ts` - Update venues table types
- `app/app/api/venues/place-details/route.ts` - **New** Optional endpoint

### Frontend

- `app/components/VenueAutocomplete.tsx` - **New** Autocomplete component
- `app/app/layout.tsx` - Add Google Maps script
- `app/app/shows/new/page.tsx` - Update form (if exists)
- Any other show entry/edit forms

### Configuration

- `app/.env.example` - Add Google Maps API keys
- `app/.env` - Local development keys (not committed)

## Success Criteria

✅ CSV uploads process venues without 1 req/sec bottleneck  
✅ Manual show entry uses autocomplete with venue suggestions  
✅ Geocoding handles misspellings and partial matches  
✅ Venue data includes accurate lat/lng coordinates  
✅ No disruption to existing venue data  
✅ API costs remain reasonable (<$50/month for typical usage)  
✅ Error rates below 5% for venue creation
