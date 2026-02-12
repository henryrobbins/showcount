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

### Schema and Migrations

Database schema design and migration strategy will be defined when the relevant plan is created. For now:
- Supabase is the database provider
- Provisioned via Terraform
- Accessible from Next.js app and potentially backend services
- Local development will use Supabase local development tools or a dev instance

## Makefile Conventions

Each service has its own Makefile with common targets:
- `make dev` - Start development server
- `make build` - Build for production
- `make clean` - Clean build artifacts
- Additional targets added as needed

## Future Topics

As the project grows, this document will be expanded to cover:
- Local database setup
- Running integration tests
- Debugging techniques
- Common development workflows
- Troubleshooting guide
