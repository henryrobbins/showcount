# showcount

Concert tracking made simple.

## Overview

showcount is a web application that allows users to track and share the concerts (shows) they have attended. The MVP provides functionality to create accounts, upload concert attendance data from CSV files, and view/edit show attendance records.

## Prerequisites

- **Node.js** >= 22
- **Bun** package manager ([installation guide](https://bun.sh))
- **Docker** (optional, for containerized development)

## Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone git@github.com:henryrobbins/showcount.git
   cd showcount
   ```

2. Navigate to the app directory:
   ```bash
   cd app
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Set up environment variables (optional for now):
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   make dev
   ```

   The application will be available at `http://localhost:3000`

### Available Commands

The project uses a Makefile for common development tasks:

- `make dev` - Start the development server
- `make build` - Create a production build
- `make install` - Install dependencies
- `make clean` - Remove build artifacts and node_modules
- `make docker-build` - Build Docker image
- `make docker-run` - Run Docker container

### Docker Usage

To run the application in a Docker container:

1. Build the Docker image:
   ```bash
   cd app
   make docker-build
   ```

2. Run the container:
   ```bash
   make docker-run
   ```

   The application will be available at `http://localhost:3000`

## Project Structure

```
├── app/              # Next.js frontend application
├── services/         # FastAPI backend services (coming soon)
├── infra/            # Terraform infrastructure (production only)
├── plans/            # Project planning documents
└── docs/             # Additional documentation
```

## Technology Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS v3, Shadcn UI
- **Backend**: FastAPI with Python (coming soon)
- **Database**: Supabase (coming soon)
- **Authentication**: Clerk (coming soon)
- **Deployment**: Vercel
- **Infrastructure**: Terraform

## Documentation

- [AGENTS.md](AGENTS.md) - AI agent guidance and project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and tech stack
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local development guidelines
- [DESIGN.md](DESIGN.md) - UI/UX design philosophy
- [STYLE.md](STYLE.md) - Code style guide
- [TODO.md](TODO.md) - Task tracking

## Contributing

This is an open-source project. Contributors should be able to clone the repository and run the application locally without needing access to production infrastructure secrets.

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guidelines.

