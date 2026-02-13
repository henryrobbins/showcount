---
name: Show Notes Column
overview: Add a notes field to shows table that allows users to add optional notes (up to 4096 characters) to each show. Notes will be visible in the table view with truncation at 100 characters, with both hover tooltip and click-to-expand functionality for full text.
todos:
  - id: database-migration
    content: Create and apply database migration to add notes column to shows table
    status: pending
  - id: update-types
    content: Update TypeScript type definitions for Show and ShowInsert interfaces
    status: pending
  - id: csv-parser
    content: Update CSV parser to handle notes column with validation
    status: pending
  - id: csv-upload-ui
    content: Update CSV upload preview UI to show notes column
    status: pending
  - id: table-view
    content: Add notes column to ShowsTable with truncation, hover tooltip, and click-to-expand
    status: pending
  - id: edit-modal
    content: Add notes textarea field to EditShowModal with character counter and validation
    status: pending
  - id: add-modal
    content: Add notes textarea field to AddShowModal (if separate component exists)
    status: pending
  - id: api-update
    content: Update PUT /api/shows/[id] endpoint to accept and validate notes field
    status: pending
  - id: api-upload
    content: Update POST /api/shows/upload endpoint to accept and validate notes field
    status: pending
  - id: testing
    content: Test all functionality including edge cases and validation
    status: pending
isProject: false
---

# Add Show Notes Column

## Overview

This plan adds a `notes` column to the shows table, enabling users to attach optional text notes (up to 4096 characters) to each show. The feature will be integrated across the database schema, CSV upload flow, table view, and edit page.

## Database Schema Changes

**Migration file**: `[infra/supabase/migrations/002_add_notes_column.sql](infra/supabase/migrations/002_add_notes_column.sql)` (new file)

Add a new migration to add the `notes` column to the shows table:

```sql
ALTER TABLE shows
ADD COLUMN notes TEXT;
```

The column will be nullable (optional) and support up to 4096 characters via a CHECK constraint or application-level validation.

## Type Definitions

**Update**: `[app/types/show.ts](app/types/show.ts)`

Add `notes` field to both interfaces:

```typescript
export interface Show {
  // ... existing fields
  notes: string | null;
}

export interface ShowInsert {
  // ... existing fields
  notes: string | null;
}
```

**Update**: `[app/types/database.ts](app/types/database.ts)`

Add `notes?: string | null` to the Supabase-generated types (if these are auto-generated, they will update automatically; if manual, add the field).

## CSV Upload Flow

### CSV Parser Updates

**Update**: `[app/lib/csv-parser.ts](app/lib/csv-parser.ts)`

1. Add `notes` to the list of supported optional columns in `validateCSVSchema()`
2. In `transformCSVToShows()`, map the `notes` column from CSV rows to the `ShowInsert.notes` field
3. Trim and handle empty values (empty string → null)
4. Validate that notes do not exceed 4096 characters

### Upload Preview

**Update**: `[app/app/upload/page.tsx](app/app/upload/page.tsx)`

1. Add a "Notes" column to the preview table (truncate to 100 chars for display)
2. Update the CSV format instructions to mention the optional `notes` column

## Table View Updates

### ShowsTable Component

**Update**: `[app/components/ShowsTable.tsx](app/components/ShowsTable.tsx)`

1. Add a "Notes" column header after "Country"
2. In the table body, render the notes cell with:
  - Truncation at 100 characters (add "..." if truncated)
  - Show "-" if notes are null/empty
  - On hover, display a tooltip with the full notes text
  - On click, expand the notes inline or open a small modal/popover with full text
3. Maintain monospace font styling for consistency

### Tooltip/Popover Component

Since the codebase doesn't currently have a tooltip component, we'll need to add one:

**Option 1**: Use a shadcn/ui Tooltip component (recommended)

- Check if `@/components/ui/tooltip` exists
- If not, install via shadcn CLI: `npx shadcn-ui@latest add tooltip`

**Option 2**: Build a custom tooltip using CSS/Tailwind

- Create a simple hover tooltip with absolute positioning

**Implementation approach**: Use shadcn Tooltip for hover, and handle click to expand inline (toggle between truncated and full text in the table cell).

## Edit Page Updates

### EditShowModal Component

**Update**: `[app/components/EditShowModal.tsx](app/components/EditShowModal.tsx)`

1. Add a `notes` state variable to track the notes field value
2. Add a textarea input field (below the "Country" field) with:
  - Label: "Notes"
  - Placeholder: "Add notes about this show (optional)"
  - Character counter showing `{length}/4096`
  - Validation to prevent exceeding 4096 characters
  - Multiple rows (e.g., 4-6 rows)
3. Include `notes` in the PUT request body when saving
4. Handle empty string → null conversion

### Add Show Functionality

**Check**: `[app/components/AddShowModal.tsx](app/components/AddShowModal.tsx)` or similar component

If there's a separate "Add Show" modal (referenced in `EditClient.tsx`), update it with the same `notes` textarea field and validation.

## API Updates

### Update Show Endpoint

**Update**: `[app/app/api/shows/[id]/route.ts](app/app/api/shows/[id]/route.ts)`

1. Accept `notes` in the request body (optional)
2. Validate that `notes` is a string or null
3. Validate that `notes` length does not exceed 4096 characters
4. Include `notes` in the Supabase update operation

### Upload Endpoint

**Update**: `[app/app/api/shows/upload/route.ts](app/app/api/shows/upload/route.ts)`

1. Accept `notes` field in each show object
2. Validate notes length (max 4096 characters)
3. Insert shows with notes into database

### Create Show Endpoint (if exists)

If there's a separate POST endpoint for creating individual shows, update it similarly to the upload endpoint.

## Validation Summary

All validation points:

- **Client-side** (CSV parser, edit modal, add modal):
  - Max 4096 characters
  - Trim whitespace
  - Empty string → null
- **Server-side** (API routes):
  - Type check (string | null)
  - Max 4096 characters
  - Return 400 error if validation fails

## UI/UX Considerations

Following the DESIGN.md principles:

1. **Typography**: Use monospace font for notes in table (consistent with other data)
2. **Truncation**: Show first 100 characters with "..." to keep table clean
3. **Hover state**: Subtle background change on hover to indicate interactivity
4. **Tooltip**: Simple white/black text tooltip on hover (no heavy styling)
5. **Inline expansion**: Clicking toggles between truncated/full text without modal (lighter interaction)
6. **Borders**: Use thin lines to separate the notes column visually

## Testing Checklist

After implementation:

1. Database migration runs successfully
2. CSV upload with `notes` column works correctly
3. CSV upload without `notes` column still works (backward compatible)
4. Notes appear in table view with truncation
5. Hover tooltip displays full notes
6. Click expands/collapses notes inline
7. Edit modal shows existing notes and allows updates
8. Add modal allows entering notes for new shows
9. Character counter works correctly (4096 limit)
10. Empty notes are handled correctly (displayed as "-")
11. Long notes (>100 chars) are truncated properly
12. Very long notes (approaching 4096) are handled without errors

## File Changes Summary

**New files:**

- `infra/supabase/migrations/002_add_notes_column.sql`

**Modified files:**

- `app/types/show.ts`
- `app/lib/csv-parser.ts`
- `app/app/upload/page.tsx`
- `app/components/ShowsTable.tsx`
- `app/components/EditShowModal.tsx`
- `app/app/api/shows/[id]/route.ts`
- `app/app/api/shows/upload/route.ts`
- Possibly: `app/components/AddShowModal.tsx` (if it exists separately)
- Possibly: `app/types/database.ts` (if manually maintained)

**Potential new component:**

- Tooltip component from shadcn/ui (if not already present)

