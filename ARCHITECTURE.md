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

