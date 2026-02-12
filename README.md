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

## Deployment

The application is deployed on Vercel and automatically deploys from the `main` branch.

- **Production URL**: [https://showcount.vercel.app](https://showcount.vercel.app) _(available after first deployment)_

Any commits pushed to the `main` branch will trigger an automatic deployment to production.

## Project Structure

```
├── app/              # Next.js frontend application
├── services/         # FastAPI backend services (coming soon)
├── infra/            # Terraform infrastructure (Vercel deployment)
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

## Infrastructure Setup (For Maintainers)

This section is only for project maintainers who need to manage the deployment infrastructure. Regular contributors do not need to perform these steps.

### Prerequisites

- Terraform installed ([installation guide](https://www.terraform.io/downloads))
- Vercel account with API token
- Maintainer access to the project

### Initial Infrastructure Setup

1. **Generate a Vercel API token**:
   - Log in to Vercel dashboard
   - Navigate to Settings → Tokens
   - Create a new token with appropriate permissions
   - Copy the token (you'll need it in the next steps)

2. **Configure Terraform variables**:
   ```bash
   cd infra
   cp .terraform.tfvars.example .terraform.tfvars
   ```

3. **Edit `.terraform.tfvars` and add your credentials**:
   ```hcl
   vercel_api_token = "your-actual-token-here"
   # vercel_team_id = "team_xxxxx"  # Uncomment if using team
   project_name = "showcount"
   ```

4. **Initialize Terraform**:
   ```bash
   terraform init
   ```

5. **Preview the infrastructure changes**:
   ```bash
   terraform plan
   ```

6. **Apply the infrastructure**:
   ```bash
   terraform apply
   ```

### Connect GitHub Repository

After Terraform creates the Vercel project, you need to manually connect the GitHub repository:

1. Go to the [Vercel dashboard](https://vercel.com/dashboard)
2. Select the "showcount" project
3. Navigate to Settings → Git
4. Click "Connect Git Repository"
5. Select the repository: `henryrobbins/showcount`
6. Confirm that `main` is set as the production branch
7. Confirm that the root directory is set to `app`

### First Deployment

Once the GitHub repository is connected, push to the `main` branch to trigger the first deployment. After the deployment completes, update the production URL in this README.

### Managing Infrastructure

- **View current state**: `terraform show`
- **Update infrastructure**: Modify `.tf` files, then run `terraform plan` and `terraform apply`
- **Destroy infrastructure**: `terraform destroy` (use with caution)

**Note**: Terraform state is stored locally in the `/infra` directory. Do not commit `.tfstate` files or `.terraform.tfvars` to the repository.

