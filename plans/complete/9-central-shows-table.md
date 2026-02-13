---
name: Central Shows Table
overview: Implement a central shows table to normalize show data across all users. Each show will have a unique show_id based on date-artist-venue_id format. User shows will reference one or more central shows, enabling data sharing and deduplication across the platform.
todos:
  - id: create-migration
    content: Create migration file 006_create_central_shows_table.sql with central_shows table, indexes, user_shows rename, and data migration logic
    status: pending
  - id: implement-show-id-utils
    content: Implement app/lib/show-id.ts with generateShowId(), normalizeArtistName(), and parseShowId() functions
    status: pending
  - id: implement-central-shows-lib
    content: Implement app/lib/central-shows.ts with findCentralShow(), getOrCreateCentralShow(), and helper functions
    status: pending
  - id: update-type-definitions
    content: Update app/types/database.ts and app/types/show.ts with new interfaces for central_shows and user_shows
    status: pending
  - id: update-shows-api-post
    content: Update POST /api/shows route to create central shows and handle duplicates
    status: pending
  - id: create-duplicate-check-api
    content: Create /api/shows/check-duplicate route for pre-flight duplicate detection
    status: pending
  - id: update-shows-api-put-delete
    content: Update PUT and DELETE in /api/shows/[id] to work with new schema
    status: pending
  - id: update-upload-api
    content: Update /api/shows/upload-with-progress to create central shows from CSV uploads
    status: pending
  - id: update-profile-queries
    content: Update user profile page queries to fetch user_shows with joined central_shows and venues
    status: pending
  - id: update-edit-queries
    content: Update edit page queries to fetch user_shows with details
    status: pending
  - id: update-shows-table-display
    content: Update ShowsTable component to display multi-artist shows with + separator and first show's venue/date
    status: pending
  - id: add-duplicate-confirmation
    content: Add duplicate show confirmation dialog to AddShowModal component
    status: pending
isProject: false
---

# Central Shows Table Implementation Plan

## Overview

This plan implements a centralized shows table where all concert information is stored once and referenced by multiple users. Currently, each user stores complete show data independently. After this implementation, show metadata (date, artist, venue) will be shared across all users who attended the same concert.

## Database Architecture Changes

### New Central Shows Table (`central_shows`)

Create a new table to store unique shows with the following schema:

```sql
CREATE TABLE central_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id TEXT UNIQUE NOT NULL,  -- e.g., '2026-02-13-phish-{venue_uuid}'
  date DATE NOT NULL,
  artist TEXT NOT NULL,          -- Single artist per row
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_central_shows_show_id ON central_shows(show_id);
CREATE INDEX idx_central_shows_date ON central_shows(date DESC);
CREATE INDEX idx_central_shows_artist ON central_shows(artist);
CREATE INDEX idx_central_shows_venue_id ON central_shows(venue_id);
CREATE UNIQUE INDEX idx_central_shows_unique ON central_shows(date, artist, venue_id);
```

**Key Design Decisions:**

- `show_id`: Slug format using ISO date (e.g., `2026-02-13-phish-abc123...`). Artist name normalized to kebab-case with non-alphanumeric characters removed
- One row per artist: Multi-artist shows create multiple `central_shows` entries
- Unique constraint on (date, artist, venue_id) prevents duplicates
- For duplicate shows (same artist/venue/date), append `-1`, `-2` to show_id

### Modify User Shows Table (`shows` → `user_shows`)

Rename and restructure the existing `shows` table:

```sql
-- Rename table
ALTER TABLE shows RENAME TO user_shows;

-- Add new columns
ALTER TABLE user_shows ADD COLUMN show_ids UUID[] NOT NULL DEFAULT '{}';

-- Migrate data: will populate show_ids during migration
-- Keep legacy columns during migration period for backward compatibility
```

**New Schema:**

- `show_ids`: Array of foreign keys to `central_shows.id`
- Most rows will have a single show_id (single artist)
- Multi-artist entries will have multiple show_ids (one per artist)
- Legacy columns (`date`, `artists`, `venue_id`) remain during migration for backward compatibility

### Migration Strategy

**Migration File:** `006_create_central_shows_table.sql`

1. Create `central_shows` table with indexes
2. Rename `shows` → `user_shows`
3. Add `show_ids` column to `user_shows`
4. Populate `central_shows` from existing `user_shows` data:
  - For each user show, split artists into separate central shows
  - Generate show_id slugs
  - Handle duplicates (check existing before insert)
5. Populate `show_ids` array in `user_shows` by matching to `central_shows`
6. Verify data integrity (all user_shows have valid show_ids)

## Backend Changes

### New Type Definitions

**File:** `[app/types/database.ts](app/types/database.ts)`

Add `central_shows` table types:

```typescript
interface Database {
  public: {
    Tables: {
      central_shows: {
        Row: {
          id: string;
          show_id: string;
          date: string;
          artist: string;
          venue_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          date: string;
          artist: string;
          venue_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: { /* ... */ };
      };
      // Update user_shows (formerly shows)
      user_shows: {
        Row: {
          // ... existing fields ...
          show_ids: string[];
        };
      };
    };
  };
}
```

**File:** `[app/types/show.ts](app/types/show.ts)`

```typescript
export interface CentralShow {
  id: string;
  show_id: string;
  date: string;
  artist: string;
  venue_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserShow {
  id: string;
  clerk_user_id: string;
  show_ids: string[];  // Array of central_shows.id
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Extended type for display (joins with central_shows and venues)
export interface UserShowWithDetails extends UserShow {
  shows: (CentralShow & { venue: Venue })[];
}
```

### Show ID Generation

**New File:** `[app/lib/show-id.ts](app/lib/show-id.ts)`

```typescript
/**
 * Generate a unique show_id slug
 * Format: {date}-{artist-slug}-{venue_id}
 * Example: 2026-02-13-phish-abc123...
 */
export function generateShowId(
  date: string,       // ISO format YYYY-MM-DD
  artist: string,     // "Trey Anastasio"
  venueId: string,
  sequence?: number   // For duplicates: -1, -2, etc.
): string;

/**
 * Normalize artist name to kebab-case slug
 * Filter out non-alphanumeric characters
 * Example: "Trey Anastasio" → "trey-anastasio"
 */
export function normalizeArtistName(artist: string): string;

/**
 * Parse a show_id back into components
 */
export function parseShowId(showId: string): {
  date: string;
  artist: string;
  venueId: string;
  sequence?: number;
};
```

### Central Shows Management

**New File:** `[app/lib/central-shows.ts](app/lib/central-shows.ts)`

```typescript
/**
 * Find existing central show by date, artist, venue_id
 */
export async function findCentralShow(
  date: string,
  artist: string,
  venueId: string
): Promise<CentralShow | null>;

/**
 * Get or create a central show
 * If duplicate detected (same date/artist/venue), return existing
 * For manual addition with potential duplicates, return duplicate info
 */
export async function getOrCreateCentralShow(params: {
  date: string;
  artist: string;
  venueId: string;
  allowDuplicate?: boolean;  // For handling same-day multiples
}): Promise<{
  centralShow: CentralShow;
  isNew: boolean;
  isDuplicate?: boolean;  // Same date/artist/venue already exists
}>;

/**
 * Create multiple central shows (bulk operation for CSV upload)
 */
export async function createCentralShows(
  shows: Array<{ date: string; artist: string; venueId: string }>
): Promise<CentralShow[]>;

/**
 * Get central shows by IDs (for fetching user show details)
 */
export async function getCentralShowsByIds(
  ids: string[]
): Promise<(CentralShow & { venue: Venue })[]>;
```

### API Route Updates

**File:** `[app/app/api/shows/route.ts](app/app/api/shows/route.ts)` (POST)

Update show creation logic:

1. Parse and validate input (date, artists array, venue info, notes)
2. Get or create venue (existing logic)
3. For each artist:
  - Call `getOrCreateCentralShow(date, artist, venue_id)`
  - Collect central show IDs
  - If duplicate detected and `allowDuplicate` not set, return 409 with duplicate info
4. Create `user_shows` entry with `show_ids` array and `notes`
5. Return created user show with details

**New Route:** `[app/app/api/shows/check-duplicate/route.ts](app/app/api/shows/check-duplicate/route.ts)` (POST)

```typescript
// Check if show already exists before creating
POST /api/shows/check-duplicate
Body: { date, artist, venueId }
Response: { exists: boolean, centralShow?: CentralShow }
```

**File:** `[app/app/api/shows/[id]/route.ts](app/app/api/shows/[id]/route.ts)` (PUT, DELETE)

Update edit/delete logic:

- PUT: Update user_shows entry, create/update central shows as needed
- DELETE: Remove user_shows entry (central shows remain for other users)

**File:** `[app/app/api/shows/upload-with-progress/route.ts](app/app/api/shows/upload-with-progress/route.ts)`

Update CSV upload logic:

1. Parse CSV and validate (existing logic)
2. Get or create venues (existing logic)
3. For each show in CSV:
  - Split artists array
  - For each artist, create/find central show
  - Collect show_ids
4. Bulk insert user_shows entries with show_ids arrays
5. Stream progress updates (existing SSE logic)

### Query Logic Updates

**File:** `[app/app/user/[username]/page.tsx](app/app/user/[username]/page.tsx)`

Update data fetching:

```typescript
// New query structure
const { data: userShows } = await supabase
  .from('user_shows')
  .select(`
    *,
    central_shows!inner(
      *,
      venues(*)
    )
  `)
  .eq('clerk_user_id', user.id)
  .order('created_at', { ascending: false });

// Transform: group central shows by user_show
// Sort by date (use first show's date for multi-artist entries)
```

**File:** `[app/app/edit/page.tsx](app/app/edit/page.tsx)`

Similar query updates for edit page.

## Frontend Changes

### Table Display Updates

**File:** `[app/components/ShowsTable.tsx](app/components/ShowsTable.tsx)`

Update to display `UserShowWithDetails`:

1. **Artists Column:**
  - For multiple artists, display as single line: "Phish + Trey Anastasio"
  - Join artist names with `+` separator
2. **Venue Columns:**
  - Use first show's venue data (all should be same venue for multi-artist)
3. **Date Column:**
  - Use first show's date (all should be same date for multi-artist)
4. **Sorting:**
  - Sort by date (extract from first show in array)

```typescript
interface ShowsTableProps {
  shows: UserShowWithDetails[];
  editable?: boolean;
  onSelectShow?: (show: UserShowWithDetails) => void;
}

// Render logic:
// artists: show.shows.map(s => s.artist).join(' + ')
// venue: show.shows[0].venue.name
// date: show.shows[0].date
```

### Manual Show Addition

**File:** `[app/components/AddShowModal.tsx](app/components/AddShowModal.tsx)`

Update submission flow:

1. User fills form (date, artists array, venue info, notes)
2. Submit to POST `/api/shows`
3. If API returns 409 (duplicate detected):
  - Show confirmation dialog:
    - "A show with this artist, date, and venue already exists."
    - "Was this a separate show at the same venue on the same day?"
    - Buttons: "Yes, create separate show" | "Cancel"
  - If "Yes": resubmit with `allowDuplicate: true`
4. On success, refresh shows list

**Confirmation Dialog Component:**

```typescript
interface DuplicateShowConfirmation {
  existingShow: CentralShow & { venue: Venue };
  onConfirm: () => void;
  onCancel: () => void;
}
```

### CSV Upload

**File:** `[app/app/upload/page.tsx](app/app/upload/page.tsx)`

No major changes needed - backend handles splitting artists and creating central shows.

## Data Migration & Testing

### Migration Checklist

1. **Backup Production Data:** Export existing shows before migration
2. **Run Migration:** Apply `006_create_central_shows_table.sql`
3. **Verify Data Integrity:**
  - All `user_shows` have non-empty `show_ids` arrays
  - All show_ids reference valid `central_shows`
  - Artist counts match (sum of artists arrays = count of central_shows)
4. **Test Queries:** Ensure user profile pages load correctly
5. **Monitor Performance:** Check query performance with joins

### Local Testing

1. Start local Supabase: `cd infra && supabase db reset`
2. Load test data (CSV upload with multi-artist shows)
3. Verify:
  - Central shows created correctly
  - User shows reference correct central shows
  - Table displays artists with + separator
  - Duplicate detection works in manual add
  - Edit/delete operations work correctly

## File Changes Summary

### New Files

- `infra/supabase/migrations/006_create_central_shows_table.sql`
- `app/lib/show-id.ts`
- `app/lib/central-shows.ts`
- `app/app/api/shows/check-duplicate/route.ts`

### Modified Files

- `app/types/database.ts` - Add central_shows, update user_shows types
- `app/types/show.ts` - Add CentralShow, UserShow, UserShowWithDetails interfaces
- `app/app/api/shows/route.ts` - Update POST to create central shows
- `app/app/api/shows/[id]/route.ts` - Update PUT/DELETE for new schema
- `app/app/api/shows/upload-with-progress/route.ts` - Update bulk upload
- `app/app/user/[username]/page.tsx` - Update query and data transformation
- `app/app/edit/page.tsx` - Update query
- `app/components/ShowsTable.tsx` - Display multi-artist shows with + separator
- `app/components/AddShowModal.tsx` - Add duplicate confirmation dialog

### Configuration Files

- No changes to DEVELOPMENT.md, package.json, or other config files

## Implementation Phases

The implementation should proceed in this order:

1. **Database Layer:** Create migration, test locally
2. **Backend Utilities:** Implement show-id.ts and central-shows.ts
3. **Type Definitions:** Update database.ts and show.ts
4. **API Routes:** Update shows endpoints
5. **Frontend Queries:** Update data fetching in pages
6. **UI Components:** Update table display and add modal
7. **Testing:** Manual testing of all flows
8. **Migration:** Run on production (with backup)

