# DEVELOPMENT.md

This file provides guidance for local development and environment management.

## Local Development Philosophy

This is an **open-source project**. Contributors should be able to:
- Clone the repository
- Run the web app and backend services locally
- Develop and test features
- Submit pull requests

**Without needing access to:**
- Production infrastructure secrets
- Terraform state
- Deployment credentials

## Environment Management

### Application Secrets (Web & Services)

Environment variables needed for local development (API keys, database connections, etc.) will be managed through `.env` files with corresponding `.env.example` files that are committed to the repository.

### Infrastructure Secrets

Infrastructure secrets (Terraform variables, deployment credentials) are:
- Localized to the `/infra` directory
- **Not required for local development**
- Only needed by project maintainers for infrastructure changes
- Managed through `.tfvars` files with `.tfvars.example` committed

## Docker

Both the web app and backend services have Docker containers that can be:
- Run individually for focused development
- Run together using Docker Compose for full-stack development

See individual service directories for Docker usage instructions.

## Testing

Testing strategy and frameworks will be added once there is code to test. Future sections will cover:
- Unit testing
- Integration testing
- E2E testing
- Running tests locally

## Database

### Supabase Setup

The application uses Supabase as its database provider. For local development, you have two options:

#### Option 1: Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Initialize Supabase locally:**
   ```bash
   cd infra
   supabase init  # Creates infra/supabase/ directory
   ```

3. **Start Supabase local instance:**
   ```bash
   cd infra
   supabase start
   ```
   This will start a local Supabase instance with PostgreSQL, Realtime, Auth, and more.

4. **Apply migrations:**
   Migrations are already in `infra/supabase/migrations/` and will be applied automatically when you run `supabase start`. To reset the database:
   ```bash
   cd infra
   supabase db reset
   ```

5. **Copy environment variables:**
   After running `supabase start`, you'll see output like:
   ```
   API URL: http://127.0.0.1:54321
   anon key: eyJh...
   ```
   Copy these to your `app/.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   ```

#### Option 2: Supabase Cloud (Development Project)

1. **Create a free project** at [supabase.com](https://supabase.com)
2. **Run the database migration** from `infra/supabase/migrations/001_create_shows_table.sql` in the SQL Editor
3. **Copy your project credentials** from Project Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Add to** `app/.env`

### Schema and Migrations

Database migrations are stored in `infra/supabase/migrations/`. The current schema includes:

- **shows table**: Stores user show attendance records
  - Links to users via `clerk_user_id`
  - RLS is disabled; authorization is handled at the application level in API routes
  - Supports multiple artists per show (using PostgreSQL arrays)

To create a new migration:
1. Create a new SQL file in `infra/supabase/migrations/` with an incremented timestamp
2. If using Supabase CLI, run `cd infra && supabase db reset` to apply
3. If using cloud, run the SQL in the Supabase dashboard

### Connecting Clerk to Supabase

The app uses Clerk for authentication. Since Clerk and Supabase are separate auth systems, we handle authorization at the application level:

1. **API routes** use Clerk's `auth()` to get the authenticated user ID
2. **Authorization checks** in the API routes ensure users can only access their own data
3. **Database queries** filter by `clerk_user_id` to enforce data isolation

This approach is simpler than integrating Clerk JWT with Supabase RLS and works well for this use case.

## Agent Service (`services/agent/`)

### Setup

```bash
cd services/agent
cp .env.example .env  # Fill in API keys
make install           # Install dependencies with uv
```

### Running

```bash
make dev        # Start dev server on port 8000
make test       # Run unit tests
make lint       # Run ruff linter
make typecheck  # Run mypy
```

### Testing Manually

```bash
curl -X POST http://localhost:8000/parse \
  -F "file=@../../data/BurberryToothbrush.txt" \
  -F "prompt=all shows from 2025"
```

## Makefile Conventions

Each service has its own Makefile with common targets:
- `make dev` - Start development server
- `make install` - Install dependencies
- `make lint` - Run linter
- `make format` - Run formatter
- `make typecheck` - Run type checker
- `make test` - Run tests
- Additional targets added as needed

## Future Topics

As the project grows, this document will be expanded to cover:
- Local database setup
- Running integration tests
- Debugging techniques
- Common development workflows
- Troubleshooting guide
