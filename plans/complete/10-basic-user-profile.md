---
name: Basic User Profile
overview: Add a user profile table with optional fields, implement profile editing modal on /user/[username], and add onboarding banner for new users to complete their profile.
todos:
  - id: create-migration
    content: Create database migration for user_profiles table
    status: pending
  - id: update-types
    content: Update database types and create profile types
    status: pending
  - id: create-api-routes
    content: Create API routes for fetching and updating profiles
    status: pending
  - id: edit-profile-modal
    content: Build EditProfileModal component with form
    status: pending
  - id: profile-display
    content: Build ProfileDisplay component
    status: pending
  - id: new-user-banner
    content: Build NewUserBanner component
    status: pending
  - id: integrate-profile-page
    content: Update /user/[username] page to show profile and edit button
    status: pending
  - id: test-implementation
    content: Manual testing of complete user profile flow
    status: pending
isProject: false
---

# Basic User Profile Implementation

## Database Schema

Create a new migration file `infra/supabase/migrations/007_create_user_profiles_table.sql`:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  caption TEXT,
  city TEXT,
  show_email BOOLEAN DEFAULT FALSE,
  song_chasing TEXT,
  band_chasing TEXT,
  favorite_show TEXT,
  favorite_venue TEXT,
  cashortrade_username TEXT,
  instagram_username TEXT,
  x_username TEXT,
  facebook_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
```

**Key decisions:**

- Username comes from Clerk (no custom username field)
- Email visibility controlled via `show_email` boolean (defaults to private)
- Social media stored as username/handle only
- "Favorite" and "Chasing" fields are free text
- All profile fields are optional (nullable)

## API Routes

### 1. GET `/api/profile/[clerkUserId]/route.ts`

Fetch a user's profile by Clerk user ID. Public endpoint (no auth required) - anyone can view profiles.

**Pattern:**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clerkUserId: string }> }
) {
  const { clerkUserId } = await params;
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !profile) {
    return NextResponse.json(null, { status: 200 });
  }

  return NextResponse.json(profile);
}
```

### 2. POST/PUT `/api/profile/route.ts`

Create or update the authenticated user's profile. Protected endpoint.

**Pattern:**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();

  // Upsert (insert or update)
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      clerk_user_id: userId,
      ...body,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "clerk_user_id"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
```

## TypeScript Types

Update `app/types/database.ts` to include the new table:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables
      user_profiles: {
        Row: {
          id: string;
          clerk_user_id: string;
          caption: string | null;
          city: string | null;
          show_email: boolean;
          song_chasing: string | null;
          band_chasing: string | null;
          favorite_show: string | null;
          favorite_venue: string | null;
          cashortrade_username: string | null;
          instagram_username: string | null;
          x_username: string | null;
          facebook_username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          caption?: string | null;
          city?: string | null;
          show_email?: boolean;
          song_chasing?: string | null;
          band_chasing?: string | null;
          favorite_show?: string | null;
          favorite_venue?: string | null;
          cashortrade_username?: string | null;
          instagram_username?: string | null;
          x_username?: string | null;
          facebook_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          caption?: string | null;
          city?: string | null;
          show_email?: boolean;
          song_chasing?: string | null;
          band_chasing?: string | null;
          favorite_show?: string | null;
          favorite_venue?: string | null;
          cashortrade_username?: string | null;
          instagram_username?: string | null;
          x_username?: string | null;
          facebook_username?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
```

Create `app/types/profile.ts`:

```typescript
import type { Database } from "./database";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];
export type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];
```

## UI Components

### 1. Edit Profile Modal (`app/components/EditProfileModal.tsx`)

Client component following the pattern of `EditShowModal.tsx` and `AddShowModal.tsx`. 

**Key features:**

- Dialog modal from shadcn
- Form with Input, Textarea components
- All fields optional
- Submit button disabled while saving
- Error handling
- Success callback to refresh parent

**Form fields:**

- Caption (Textarea, max 280 chars)
- City (Input)
- Email visibility (Checkbox - "Show my email on my profile")
- Song I'm Chasing (Input)
- Band I'm Chasing (Input)
- Favorite Show (Input)
- Favorite Venue (Input)
- CashOrTrade Username (Input)
- Instagram Username (Input)
- X Username (Input)
- Facebook Username (Input)

**Styling considerations:**

- Monospace typography for inputs (per DESIGN.md)
- Clean form layout with labels
- Subtle borders separating sections
- Follow existing modal patterns

### 2. Profile Display Component (`app/components/ProfileDisplay.tsx`)

Client component to display filled-out profile fields on `/user/[username]`.

**Key features:**

- Only shows fields that have values
- Social links clickable (construct URLs from usernames)
- Email shown only if `show_email` is true
- Monospace typography
- Clean, newspaper-like layout with strategic use of lines

**Social URL construction:**

- CashOrTrade: `https://cashortrade.org/profile/{username}`
- Instagram: `https://instagram.com/{username}`
- X: `https://x.com/{username}`
- Facebook: `https://facebook.com/{username}`

### 3. New User Banner (`app/components/NewUserBanner.tsx`)

Client component showing a dismissible banner prompting users to complete their profile.

**Behavior:**

- Shows if user is viewing their own profile
- Shows if user has no profile or profile is mostly empty
- Dismissible (use localStorage to remember dismissal)
- Message: "Complete your profile to help others learn more about you"
- "Edit Profile" button that opens EditProfileModal
- Can be dismissed with X button

## Page Updates

### Update `/app/user/[username]/page.tsx`

1. Fetch user profile data alongside show data
2. Pass profile to ProfileDisplay component
3. Show "Edit Profile" button if viewing own profile
4. Show NewUserBanner if applicable
5. Display profile info above or alongside shows table

**Layout structure:**

```
┌─────────────────────────────┐
│ [NewUserBanner (if needed)] │
├─────────────────────────────┤
│ Username Header             │
│ [Edit Profile] button       │
├─────────────────────────────┤
│ ProfileDisplay              │
├─────────────────────────────┤
│ Shows Table                 │
└─────────────────────────────┘
```

## Onboarding Flow

Since we're using an optional banner approach:

- No redirect or forced modal
- NewUserBanner component handles the prompt
- Users can dismiss and complete later
- Banner reappears on subsequent visits until profile is completed or permanently dismissed

## Testing Checklist

Manual testing to verify:

1. New migration creates table successfully
2. API endpoints work (GET profile, POST/PUT profile)
3. Edit profile modal opens and saves correctly
4. Profile displays only filled fields
5. Social links work correctly
6. Email visibility toggle works
7. New user banner appears for incomplete profiles
8. Banner can be dismissed
9. Users can only edit their own profile
10. Profile persists across sessions

## Implementation Order

1. Create database migration
2. Update TypeScript types
3. Create API routes (GET and POST/PUT)
4. Create EditProfileModal component
5. Create ProfileDisplay component
6. Create NewUserBanner component
7. Update `/user/[username]` page to integrate components
8. Manual testing

## Design Considerations

Following DESIGN.md principles:

- Monospace typography throughout
- Black on white color scheme
- Strategic use of horizontal lines to separate sections
- Minimal color usage
- Clean, newspaper-like data presentation
- Avoid full grid layouts

