---
name: Configure Clerk Authentication
overview: Integrate Clerk authentication into the Next.js app with sign-in/sign-out functionality, a protected user page showing the user's name, and authentication UI on the homepage.
todos:
  - id: install-clerk
    content: Install @clerk/nextjs package
    status: pending
  - id: env-config
    content: Update .env.example with Clerk variables
    status: pending
  - id: middleware
    content: Create middleware.ts for route protection
    status: pending
  - id: root-layout
    content: Wrap app with ClerkProvider in layout.tsx
    status: pending
  - id: homepage-auth
    content: Add authentication UI to homepage
    status: pending
  - id: user-page
    content: Create protected /user page
    status: pending
  - id: auth-routes
    content: Create sign-in and sign-up pages
    status: pending
  - id: docs
    content: Update README with authentication instructions
    status: pending
  - id: test
    content: Verify authentication flows work correctly
    status: pending
isProject: false
---

# Configure Clerk Authentication

## Prerequisites

You have an existing Clerk application:

- App ID: `app_2w1MxquuQHzgC2OnjcmMFi6ksNX`
- Development Instance: `ins_2w1MxmBPiFs7V3aRUH6reh9jJCQ`
- Dashboard URL: [https://dashboard.clerk.com/apps/app_2w1MxquuQHzgC2OnjcmMFi6ksNX](https://dashboard.clerk.com/apps/app_2w1MxquuQHzgC2OnjcmMFi6ksNX)

## Implementation Steps

### 1. Install Clerk SDK

Install the Clerk Next.js SDK package in the `[app/](app/)` directory:

```bash
bun add @clerk/nextjs
```

### 2. Environment Configuration

Update `[app/.env.example](app/.env.example)` to include Clerk environment variables with instructions on how to obtain them from the Clerk dashboard.

Add corresponding entries to a new or existing `app/.env` file with actual values (this file should already be gitignored).

**Required environment variables:**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard → API Keys
- `CLERK_SECRET_KEY` - From Clerk dashboard → API Keys (keep secret, server-side only)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` (optional, default works)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` (optional, default works)

### 3. Middleware Setup

Create `[app/middleware.ts](app/middleware.ts)` at the root of the app directory to enable Clerk authentication across the application. This will:

- Protect the `/user` route (authenticated users only)
- Allow public access to all other routes (including homepage)

Use the standard Clerk matcher pattern to exclude static assets.

### 4. Root Layout Integration

Update `[app/app/layout.tsx](app/app/layout.tsx)` to wrap the application with `<ClerkProvider>`. This makes authentication state available throughout the app.

### 5. Homepage Authentication UI

Update `[app/app/page.tsx](app/app/page.tsx)` to add authentication controls:

- When signed out: Show Clerk's `<SignInButton>` (styled consistently with the bold, bordered design)
- When signed in: Show Clerk's `<UserButton>` component for account management

Use Clerk's conditional rendering components (`<SignedIn>`, `<SignedOut>`) to toggle between states.

**Design considerations** (per `[DESIGN.md](DESIGN.md)`):

- Maintain monospace typography
- Use black borders and minimal color
- Keep the bold, newspaper-like aesthetic
- Position auth controls near the main heading

### 6. Protected User Page

Create a new route at `[app/app/user/page.tsx](app/app/user/page.tsx)` that:

- Displays the authenticated user's name
- Uses Clerk's `auth()` helper to get user data server-side
- Redirects to sign-in if user is not authenticated
- Follows the established design system (monospace, bordered layout)

The page should be simple and clean, showing only the user's name as specified in the plan requirements.

### 7. Sign-In/Sign-Up Routes

Create Clerk's built-in authentication pages:

- `[app/app/sign-in/[[...sign-in]]/page.tsx](app/app/sign-in/[[...sign-in]]/page.tsx)` - Sign in page
- `[app/app/sign-up/[[...sign-up]]/page.tsx](app/app/sign-up/[[...sign-up]]/page.tsx)` - Sign up page

These use Clerk's `<SignIn>` and `<SignUp>` components which handle all authentication flows.

### 8. TypeScript Configuration

Verify that `[app/tsconfig.json](app/tsconfig.json)` has the path alias `@/*` properly configured for imports (should already be set up from shadcn).

### 9. Documentation Updates

Update `[README.md](README.md)` to include:

**New "Authentication" section** covering:

- How to obtain Clerk API keys from the dashboard
- Step-by-step instructions for adding keys to `.env`
- Link to Clerk dashboard
- Note about development vs production instances

**Update "Technology Stack" section:**

- Change "Authentication: Clerk (coming soon)" to "Authentication: Clerk"

**Update "Getting Started" section:**

- Emphasize that authentication setup is now required (not optional)
- Update step 4 to require copying and configuring `.env` file

## Testing Checklist

After implementation, verify:

- Homepage loads for unauthenticated users
- Sign-in button appears on homepage when logged out
- Sign-up flow works correctly
- Sign-in flow works correctly
- UserButton appears after authentication
- `/user` page redirects to sign-in when not authenticated
- `/user` page shows user's name when authenticated
- Sign-out works from UserButton dropdown
- Middleware properly protects `/user` route
- No TypeScript errors
- Biome linting passes

## Key Technical Decisions

1. **Clerk Components**: Using Clerk's pre-built `<SignInButton>`, `<UserButton>`, `<SignIn>`, and `<SignUp>` components for consistency and maintainability
2. **Route Protection**: Middleware-based protection with `clerkMiddleware()` and `createRouteMatcher()`
3. **Server-Side Auth**: Using `auth()` helper in `/user` page for server-side user data fetching
4. **Environment Variables**: Following Next.js conventions with `NEXT_PUBLIC_` prefix for client-accessible keys
5. **Development-Only**: Setup is manual via `.env` file for development; Terraform config deferred to future production setup

## Files Modified/Created

**Modified:**

- `[app/package.json](app/package.json)` - Add @clerk/nextjs dependency
- `[app/.env.example](app/.env.example)` - Add Clerk environment variable templates
- `[app/app/layout.tsx](app/app/layout.tsx)` - Wrap with ClerkProvider
- `[app/app/page.tsx](app/app/page.tsx)` - Add authentication UI
- `[README.md](README.md)` - Add authentication documentation

**Created:**

- `app/middleware.ts` - Clerk middleware configuration
- `app/app/user/page.tsx` - Protected user profile page
- `app/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `app/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page

