---
name: Venues Table Implementation
overview: Create a new venues table to store venue location data from OpenStreetMap API, refactor shows table to reference venues, and implement automatic venue lookup during show creation/editing.
todos:
  - id: create-venues-migration
    content: Create 003_create_venues_table.sql migration with venues table schema, indexes, and triggers
    status: completed
  - id: migrate-shows-schema
    content: Create 004_migrate_shows_to_venues.sql migration to add venue_id foreign key to shows table
    status: completed
  - id: update-database-types
    content: Update app/types/database.ts with venues table interfaces and venue_id in shows table
    status: completed
  - id: create-venue-types
    content: Create app/types/venue.ts with venue-specific type definitions
    status: completed
  - id: implement-osm-service
    content: Create app/lib/osm.ts with OpenStreetMap Nominatim API integration and rate limiting
    status: completed
  - id: implement-venue-service
    content: Create app/lib/venues.ts with findVenue, createVenueFromOSM, and getOrCreateVenue functions
    status: completed
  - id: update-shows-post-api
    content: Update POST handler in app/api/shows/route.ts to integrate venue lookup and creation
    status: completed
  - id: update-shows-get-api
    content: Update GET handler in app/api/shows/route.ts to join with venues table
    status: completed
  - id: update-shows-put-api
    content: Update PUT handler in app/api/shows/[id]/route.ts to handle venue updates
    status: completed
  - id: update-shows-upload-api
    content: Update POST handler in app/api/shows/upload/route.ts to handle bulk venue creation with rate limiting
    status: completed
isProject: false
---

# Venues Table with Locations Implementation Plan

## Overview

This plan implements a new `venues` table that stores venue location data fetched from the OpenStreetMap (Nominatim) API. The `shows` table will be refactored to reference venues via foreign key instead of storing denormalized venue data.

## Database Schema Changes

### 1. Create Venues Table Migration

**File:** `[infra/supabase/migrations/003_create_venues_table.sql](infra/supabase/migrations/003_create_venues_table.sql)`

Create a new migration with:

- `id` (UUID, primary key)
- `name` (TEXT, not null) - venue name
- `city` (TEXT, nullable) - city name
- `country` (TEXT, not null) - country name (enforced by matching logic)
- `latitude` (NUMERIC, nullable) - from OSM
- `longitude` (NUMERIC, nullable) - from OSM
- `osm_place_id` (TEXT, nullable) - OpenStreetMap place ID for reference
- `osm_display_name` (TEXT, nullable) - full address from OSM
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

Add indexes:

- Index on `(name, city, country)` for fast lookups
- Trigger to auto-update `updated_at`

### 2. Migrate Shows Table

**File:** `[infra/supabase/migrations/004_migrate_shows_to_venues.sql](infra/supabase/migrations/004_migrate_shows_to_venues.sql)`

- Add `venue_id` (UUID, nullable, foreign key to venues table)
- Keep existing `venue`, `city`, `state`, `country` columns for now (to be removed later after migration)
- Add index on `venue_id`

## TypeScript Type Definitions

### Update Database Types

**File:** `[app/types/database.ts](app/types/database.ts)`

Add `venues` table interface with `Row`, `Insert`, and `Update` types. Update `shows` table interface to include `venue_id` field while keeping legacy location fields.

### Create Venue Types

**File:** `[app/types/venue.ts](app/types/venue.ts)` (new file)

Create venue-specific types for:

- `Venue` - full venue object
- `VenueInsert` - for creating venues
- `VenueSearchParams` - for matching venues

## OpenStreetMap Integration

### Create OSM Service

**File:** `[app/lib/osm.ts](app/lib/osm.ts)` (new file)

Create utility functions for OpenStreetMap Nominatim API:

- `searchVenue(name: string, city?: string, country?: string)` - search for a venue
- Rate limiting considerations (Nominatim requires 1 request/second max)
- Error handling for API failures
- Parse OSM response to extract: lat, lng, place_id, display_name, city, country

Search query format: `"venue_name, city, country"` (all available fields concatenated)

### Create Venue Service

**File:** `[app/lib/venues.ts](app/lib/venues.ts)` (new file)

Create venue management functions:

- `findVenue(name: string, city?: string, country?: string)` - check if venue exists in database
  - Matching logic: requires at least one of (name, city, country) to be specified
  - If country is "USA", require all three fields
  - Query: `WHERE name = ? AND city = ? AND country = ?` (with appropriate null handling)
- `createVenueFromOSM(name: string, city?: string, country?: string)` - fetch from OSM and create venue record
  - Call OSM search API
  - If results found, take top result
  - Verify venue doesn't already exist (race condition check)
  - Insert into venues table
- `getOrCreateVenue(name: string, city?: string, country?: string)` - find existing or create new
  - First check database
  - If not found, call OSM API
  - Return venue ID

## API Route Updates

### Update POST /api/shows

**File:** `[app/app/api/shows/route.ts](app/app/api/shows/route.ts)`

Modify the `POST` handler:

1. Extract venue info from request body (name, city, country)
2. Validate: if country is "USA", require all three fields
3. Call `getOrCreateVenue()` to get/create venue
4. Create show with `venue_id` reference
5. Keep legacy fields null for new shows
6. Return show with joined venue data

### Update PUT /api/shows/[id]

**File:** `[app/app/api/shows/[id]/route.ts](app/app/api/shows/[id]/route.ts)`

Modify the `PUT` handler:

1. Extract venue info from request body
2. Call `getOrCreateVenue()` to get/create venue
3. Update show with new `venue_id`
4. Keep legacy fields null
5. Return show with joined venue data

### Update POST /api/shows/upload

**File:** `[app/app/api/shows/upload/route.ts](app/app/api/shows/upload/route.ts)`

Modify the bulk upload handler:

1. For each show in the batch, extract venue info
2. Call `getOrCreateVenue()` for each unique venue (deduplicate within batch)
3. Map venue IDs to shows
4. Insert shows with `venue_id` references
5. Handle OSM rate limiting (1 req/second) - may need to batch/throttle requests
6. Return success with venue data

### Update GET /api/shows

**File:** `[app/app/api/shows/route.ts](app/app/api/shows/route.ts)`

Modify the `GET` handler to join with venues table and return denormalized venue data for backward compatibility with existing components.

## Frontend Updates

### Update Show Types

**File:** `[app/types/show.ts](app/types/show.ts)`

Update `Show` interface to include venue fields (denormalized from join):

- Keep `venue`, `city`, `state`, `country` as strings for display
- Add optional `venue_id` for internal use

No changes needed to `ShowInsert` since API handles venue creation transparently.

### Update Components

No changes needed to:

- `[ShowsTable.tsx](app/components/ShowsTable.tsx)` - already displays denormalized venue data
- `[AddShowModal.tsx](app/components/AddShowModal.tsx)` - already collects venue/city/state/country
- `[EditShowModal.tsx](app/components/EditShowModal.tsx)` - already collects venue/city/state/country
- `[upload/page.tsx](app/app/upload/page.tsx)` - already handles venue data in CSV

The API changes are transparent to the frontend - components continue to work with venue name/city/country as strings.

## Environment Configuration

No new environment variables needed - OpenStreetMap Nominatim API is free and doesn't require API keys. We'll use the public endpoint with proper User-Agent headers.

## Migration Strategy for Existing Shows

Existing shows will have `venue_id = null` and retain their original `venue`, `city`, `state`, `country` values. The application will:

- Display legacy venue data for old shows
- Create venue records only for new/edited shows
- Eventually a migration script can backfill venue records for existing shows (future work)

## Validation Rules

1. When country is "USA", require venue name, city, and country
2. For non-USA, require at least one of (name, city, country)
3. Venue matching uses (name, city, country) - all three must match
4. OSM search includes all available fields for best accuracy

## Error Handling

- OSM API failures: Log error, proceed with show creation but `venue_id = null`
- Rate limiting: Implement 1 second delay between OSM requests in bulk uploads
- Network timeouts: Set reasonable timeout (5 seconds) for OSM requests
- Duplicate venue checks: Handle race conditions gracefully (find again if insert fails)

## Testing Considerations

After implementation, test:

1. Adding a show with a new venue (should create venue record)
2. Adding a show with an existing venue (should reuse venue record)
3. CSV upload with multiple shows at same venue (should deduplicate)
4. CSV upload with many venues (should respect rate limiting)
5. International venues without state
6. USA venues with all fields required
7. OSM API failure scenarios

## Database Cleanup (Future)

After venue system is stable and all shows have been migrated:

1. Create migration to drop `venue`, `city`, `state`, `country` columns from shows table
2. Update TypeScript types to remove legacy fields
3. Update frontend to use joined venue data exclusively

