---
name: Create Next.js Template
overview: Create a Next.js application in `/app` with TypeScript, Shadcn UI, Tailwind CSS v3, and Docker support, following the project's design guidelines for a minimal landing page.
todos:
  - id: init-nextjs
    content: Initialize Next.js project with bun in /app directory
    status: pending
  - id: setup-biome
    content: Configure Biome for TypeScript linting and formatting
    status: pending
  - id: setup-shadcn
    content: Initialize Shadcn UI with minimal styling configuration
    status: pending
  - id: create-landing
    content: Create landing page with SHOWCOUNT text and design styling
    status: pending
  - id: create-docker
    content: Create Dockerfile and .dockerignore for containerization
    status: pending
  - id: create-makefile
    content: Create Makefile with dev, build, and clean targets
    status: pending
  - id: update-docs
    content: Update ARCHITECTURE.md and README.md with setup instructions
    status: pending
  - id: verify
    content: Test all make targets and Docker build
    status: pending
isProject: false
---

# Create Next.js Template Application

## Overview

Create a Next.js application in the `/app` directory with the landing page showing "SHOWCOUNT" following the minimalist, newspaper-style design guidelines.

## Key Decisions

**Directory Structure**: Using `/app` directory as specified in the plan (note: this differs from ARCHITECTURE.md which mentions `/web`, but we'll follow the plan's explicit instruction)

**Tech Stack**:

- Next.js with TypeScript
- Tailwind CSS v3 (updating ARCHITECTURE.md to reflect stable v3 instead of beta v4)
- Shadcn UI for components
- Bun for package management
- Node >=22
- Biome for linting/formatting

**Design Philosophy** (from [DESIGN.md](DESIGN.md)):

- Newspaper style: black text on white background
- Monospace typography throughout
- Minimal color usage
- Clean, data-focused aesthetic
- Strategic use of lines with varying weights

## Implementation Steps

### 1. Initialize Next.js Project

Use `bun create next-app` to bootstrap the project in `/app` with:

- TypeScript enabled
- App Router (not Pages Router)
- Tailwind CSS configured
- No default src directory (keeping app in root of `/app`)

### 2. Configure Project Dependencies

Update `package.json` with required dependencies:

- Shadcn UI setup (requires `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge`)
- Add Biome for linting/formatting
- Configure for bun usage

### 3. Setup Development Tools

**Biome Configuration** (`biome.json`):

- Configure TypeScript linting rules per [STYLE.md](STYLE.md)
- Setup formatting with appropriate rules
- Configure import sorting for the three-section grouping

**Tailwind Configuration** (`tailwind.config.ts`):

- Ensure monospace fonts are primary
- Minimal color palette (primarily black/white)
- Setup for Shadcn UI compatibility

**TypeScript Configuration** (`tsconfig.json`):

- Path aliases (@/components, @/lib, etc.)
- Strict mode enabled

### 4. Initialize Shadcn UI

Run `bunx shadcn@latest init` to:

- Create `components.json` configuration
- Setup component structure in `/app/components/ui`
- Configure with minimal styling to match design philosophy

### 5. Create Landing Page

**File**: `app/page.tsx`

- Center "SHOWCOUNT" text (large, monospace)
- Subtitle: "Concert tracking. Coming soon."
- Clean layout following newspaper aesthetic
- Export default at end of file per [STYLE.md](STYLE.md)

**Styling approach**:

- Minimal custom CSS
- Use Tailwind utilities
- Monospace font (`font-mono`)
- Black on white theme

### 6. Create Docker Configuration

**Dockerfile** in `/app`:

- Multi-stage build (dependencies → builder → runner)
- Based on node:22-alpine
- Uses bun for installation
- Optimized layer caching
- Exposes port 3000
- Production-ready with proper user permissions

**.dockerignore**:

- Exclude node_modules, .next, .git, etc.
- Keep only necessary files for build

### 7. Create Makefile

**File**: `app/Makefile`

Targets:

- `make dev`: Run `bun dev` for development server
- `make build`: Run `bun run build` to create production build
- `make clean`: Remove `.next/`, `node_modules/`, and build artifacts
- Optional: `make docker-build`, `make docker-run` for Docker workflows

### 8. Update Documentation

**Update [ARCHITECTURE.md**](ARCHITECTURE.md):

- Change Tailwind CSS v4 → v3 (stable version decision)

**Update [README.md**](README.md):

- Project description (showcount - concert tracking app)
- Prerequisites:
  - Node.js >=22
  - Bun package manager
  - Docker (for containerized development)
- Local development setup:
  1. Clone repository
  2. Navigate to `/app`
  3. Run `bun install`
  4. Copy `.env.example` to `.env` (if needed)
  5. Run `make dev`
- Available make commands documentation
- Docker usage instructions

**Create `.env.example**` in `/app`:

- Placeholder for future environment variables
- Currently empty but establishes the pattern

### 9. Verify Implementation

- Test `make dev` starts development server
- Test `make build` creates production build
- Test `make clean` removes artifacts
- Verify Docker build and run work correctly
- Check landing page displays correctly with proper styling
- Ensure Biome linting passes

## Files to Create/Modify

### New Files

- `/app/package.json`
- `/app/next.config.ts`
- `/app/tsconfig.json`
- `/app/tailwind.config.ts`
- `/app/postcss.config.mjs`
- `/app/biome.json`
- `/app/components.json`
- `/app/app/layout.tsx`
- `/app/app/page.tsx`
- `/app/app/globals.css`
- `/app/Dockerfile`
- `/app/.dockerignore`
- `/app/Makefile`
- `/app/.env.example`
- `/app/.gitignore`

### Modified Files

- `/ARCHITECTURE.md` (Tailwind v4 → v3)
- `/README.md` (add project description and setup instructions)

## Notes

- The app directory structure diverges from ARCHITECTURE.md's `/web` mention, but follows the explicit plan instruction
- Tailwind v3 chosen for stability over v4 beta
- Docker Compose deferred to future plan when backend services are added
- Shadcn UI components will be added on-demand in future plans

