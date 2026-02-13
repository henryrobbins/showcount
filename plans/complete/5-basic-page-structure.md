---
name: Basic Page Structure
overview: Add a persistent header and footer to the application with navigation links, Clerk authentication integration, and newspaper-inspired minimalist styling.
todos:
  - id: create-header
    content: Create Header component with navigation and Clerk auth integration
    status: pending
  - id: create-footer
    content: Create Footer component with copyright text
    status: pending
  - id: update-layout
    content: Update root layout to include Header and Footer with flex layout
    status: pending
  - id: adjust-homepage
    content: Adjust homepage layout to work with header/footer structure
    status: pending
  - id: verify-styling
    content: Verify all pages display correctly with header/footer and match design philosophy
    status: pending
isProject: false
---

# Add Basic Page Structure (Header & Footer)

## Overview

Add a persistent header and footer to all pages in the application. The header will contain navigation links and Clerk authentication UI, while the footer will display copyright information. Both components follow the monospace, newspaper-inspired design philosophy.

## Implementation Details

### 1. Create Header Component

**File:** `app/components/Header.tsx`

The header will contain:

- **Left side:** "Home" link pointing to `/`
- **Center/Right:** "My Shows" link (always visible, redirects to sign-in if not authenticated)
- **Right side:** Clerk `<UserButton />` for profile/sign-out when signed in, or sign-in button when signed out
- **Styling:** Monospace font, black text on white, horizontal lines above and below
- **Width:** Uses contained max-width (matching `max-w-6xl` used in existing pages like `[app/app/user/[username]/page.tsx](app/app/user/[username]/page.tsx)`)

Implementation approach:

- Use Clerk's `<SignedIn>`, `<SignedOut>`, and `useUser()` hooks to conditionally show auth UI
- Use Next.js `<Link>` component for navigation
- Create a client component to handle dynamic auth-based navigation
- Apply horizontal border lines using Tailwind's border utilities
- Match the existing design patterns from `[app/components/ShowsTable.tsx](app/components/ShowsTable.tsx)` (monospace, black borders)

### 2. Create Footer Component

**File:** `app/components/Footer.tsx`

The footer will contain:

- Copyright text: "© 2025 showcount"
- **Styling:** Monospace font, centered text, horizontal line above
- **Width:** Contained max-width matching header

### 3. Update Root Layout

**File:** `[app/app/layout.tsx](app/app/layout.tsx)`

Integrate the Header and Footer components:

- Add `<Header />` at the top of the body
- Add `<Footer />` at the bottom
- Ensure proper spacing so page content appears between them
- Consider using a flex layout with min-h-screen to keep footer at bottom

Current layout structure:

```18:20:app/app/layout.tsx
      <html lang="en">
        <body suppressHydrationWarning>{children}</body>
      </html>
```

Will become:

```typescript
<html lang="en">
  <body suppressHydrationWarning>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  </body>
</html>
```

### 4. Update Existing Pages

Review and update pages to ensure they work well with the new header/footer:

- `**[app/app/page.tsx](app/app/page.tsx)`:** May need layout adjustments since it currently uses full-screen centering
- `**[app/app/user/[username]/page.tsx](app/app/user/[username]/page.tsx)`:** Should work fine with existing structure
- `**[app/app/upload/page.tsx](app/app/upload/page.tsx)`:** Should work fine with existing structure

### 5. Handle "My Shows" Navigation Logic

The "My Shows" link needs to:

- Show for all users (authenticated or not)
- If authenticated: Link to `/user/[username]` using the current user's username from Clerk
- If not authenticated: Use `<SignInButton>` wrapper or redirect to `/sign-in` with a return URL

Use a pattern like:

```typescript
<SignedIn>
  <Link href={`/user/${user?.username}`}>My Shows</Link>
</SignedIn>
<SignedOut>
  <SignInButton mode="redirect" redirectUrl={`/user/${user?.username || ''}`}>
    <button>My Shows</button>
  </SignInButton>
</SignedOut>
```

## Design Specifications

Following `[DESIGN.md](DESIGN.md)`:

- Monospace typography throughout (using Tailwind's `font-mono`)
- Black text on white background
- Strategic use of horizontal lines with varying weights
- Minimal color usage
- Clean, newspaper-inspired aesthetic

Following `[STYLE.md](STYLE.md)`:

- Component files export default at end
- PascalCase for component names
- Proper import grouping (React, third-party, custom)
- Use `interface` for props types

## Files to Create

- `app/components/Header.tsx` - Navigation header with auth integration
- `app/components/Footer.tsx` - Simple copyright footer

## Files to Modify

- `[app/app/layout.tsx](app/app/layout.tsx)` - Add Header and Footer
- `[app/app/page.tsx](app/app/page.tsx)` - Adjust layout to work with header/footer

## Testing Considerations

After implementation, verify:

1. Header appears on all pages (home, sign-in, sign-up, user profile, upload)
2. Footer appears on all pages
3. "Home" link navigates to `/`
4. "My Shows" redirects to sign-in when logged out
5. "My Shows" navigates to user profile when logged in
6. Clerk UserButton displays and functions correctly
7. Visual styling matches newspaper/monospace design philosophy
8. Responsive behavior on mobile (if needed)

