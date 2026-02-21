# ARCHITECTURE.md

- **Deployment:** Vercel (both web app and backend services)
- **Infrastructure as Code:** Terraform (local state, production environment)
- **Database:** Supabase (provisioned via Terraform)
- **User Authentication:** Clerk
- **Containerization:** Docker (for web app and backend services, can run individually or together)

## Web Application

- **Framework:** Next.js
- **Language:** TypeScript
- **UI Framework:** Shadcn UI
- **Package Management:** bun
- **Styling:** Tailwind CSS v3
- **Node Version:** >=22
- **Database Access:** Supabase (direct access from Next.js)

## Backend Services

- **Framework:** Fast API
- **Language:** Python
- **Python Version:** >=3.11
- **Package Management:** uv

### Agent Service (`services/agent/`)

AI-powered show parsing service. Accepts file uploads (`.txt`, `.md`, `.csv`, `.xlsx`) and uses Claude to parse unstructured concert attendance data into structured show records.

- **Endpoint:** `POST /parse` — SSE stream of parsed/resolved shows
- **AI:** Anthropic Claude (Sonnet for parsing, Haiku for date normalization)
- **External APIs:** Google Maps Geocoding (venue resolution)
- **Database:** Supabase (venue and central show find/create)

