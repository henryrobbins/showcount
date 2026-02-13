---
name: Deploy Next.js on Vercel
overview: Set up Terraform infrastructure to create and manage a Vercel project for the Next.js app, with automatic deployments from the main branch via manual GitHub integration.
todos:
  - id: create-infra-dir
    content: Create /infra directory with Terraform configuration files
    status: pending
  - id: terraform-main
    content: Write main.tf with Vercel provider and project resource
    status: pending
  - id: terraform-variables
    content: Write variables.tf with required variable definitions
    status: pending
  - id: terraform-outputs
    content: Write outputs.tf to export project URL and details
    status: pending
  - id: tfvars-example
    content: Create .terraform.tfvars.example with example configuration
    status: pending
  - id: gitignore-infra
    content: Create .gitignore files to protect secrets and state
    status: pending
  - id: update-readme
    content: Update README.md with deployment, infrastructure, and Docker documentation
    status: pending
isProject: false
---

# Deploy Next.js App on Vercel with Terraform

## Overview

Create Terraform configuration in `/infra` to provision a Vercel project named "showcount" that will deploy the Next.js app automatically from the `main` branch. The GitHub repository connection will be configured manually through Vercel's dashboard for simplicity.

## Infrastructure Setup

### Directory Structure

Create `/infra` directory with:

- `main.tf` - Core Terraform configuration
- `variables.tf` - Variable definitions
- `outputs.tf` - Output values (like project URL)
- `.terraform.tfvars.example` - Example configuration file
- `.gitignore` - Exclude secrets and Terraform state

### Terraform Configuration

**Provider Setup (`main.tf`)**:

- Use the official Vercel provider (`vercel/vercel`)
- Configure with API token from environment or tfvars
- Set Terraform required version constraints

**Resources to Create**:

1. `vercel_project` - Creates the "showcount" project
  - Set framework preset to "nextjs"
  - Configure root directory as `./app`
  - Set production branch to "main"
  - Enable automatic deployments

**Variables (`variables.tf`)**:

- `vercel_api_token` - Sensitive, required for authentication
- `vercel_team_id` - Optional, for team accounts
- `project_name` - Default to "showcount"

**Example File (`.terraform.tfvars.example`)**:

```hcl
vercel_api_token = "your-vercel-api-token-here"
# vercel_team_id = "team_xxxxx"  # Uncomment if using team
project_name = "showcount"
```

### Security & State Management

- Terraform state stored locally (no remote backend)
- Add `.terraform/`, `*.tfstate*`, `.terraform.tfvars` to `.gitignore`
- `.terraform.tfvars.example` committed to repo as template
- Actual `.terraform.tfvars` contains secrets, never committed

## Documentation Updates

### README.md Updates

Add three new sections to `[README.md](README.md)`:

**1. Deployment Section**:

- Explain that the app is deployed on Vercel
- Link to live production URL (will be available after first deployment)
- Note that deployments happen automatically from `main` branch

**2. Infrastructure Setup (For Maintainers)**:

- Prerequisites: Terraform installed, Vercel account with API token
- Step-by-step instructions:
  1. Generate Vercel API token
  2. Navigate to `/infra` directory
  3. Copy `.terraform.tfvars.example` to `.terraform.tfvars`
  4. Fill in the API token and optional team ID
  5. Run `terraform init`
  6. Run `terraform plan` to preview changes
  7. Run `terraform apply` to create infrastructure
- Instructions for connecting GitHub:
  1. Go to Vercel dashboard
  2. Select the "showcount" project
  3. Navigate to Settings → Git
  4. Connect the GitHub repository (`henryrobbins/showcount`)
  5. Confirm `main` branch is set as production branch
- Note that this section is only for project maintainers managing infrastructure

**3. Docker Usage Section** (already exists, verify completeness):

- Ensure Docker instructions in `[README.md](README.md)` match those in `[app/Dockerfile](app/Dockerfile)` and `[app/Makefile](app/Makefile)`

### Update Project Structure

Modify the project structure diagram in `[README.md](README.md)` to reflect that `/infra` now contains Terraform files:

```
├── app/              # Next.js frontend application
├── services/         # FastAPI backend services (coming soon)
├── infra/            # Terraform infrastructure (Vercel deployment)
├── plans/            # Project planning documents
└── docs/             # Additional documentation
```

## Implementation Order

1. Create `/infra` directory structure
2. Write Terraform configuration files (`main.tf`, `variables.tf`, `outputs.tf`)
3. Create `.terraform.tfvars.example` with example values
4. Create `/infra/.gitignore` for Terraform-specific ignores
5. Update root `.gitignore` to exclude `/infra/.terraform.tfvars`
6. Update `[README.md](README.md)` with deployment and infrastructure documentation
7. Verify all documentation references are accurate

## Post-Implementation Manual Steps

After Terraform creates the Vercel project, the maintainer will need to:

1. Run `terraform apply` in the `/infra` directory (requires Vercel API token)
2. Manually connect GitHub repository through Vercel dashboard
3. Push to `main` branch to trigger first deployment
4. Update `[README.md](README.md)` with the live production URL once deployed

## Technical Notes

- The Vercel Terraform provider handles project creation and basic configuration
- GitHub integration is intentionally manual to avoid requiring GitHub token in Terraform
- Environment variables for the Next.js app (like Clerk, Supabase) will be added later through Vercel dashboard or Terraform as needed
- The `/app` directory is specified as root since Next.js app is in a subdirectory
- No Supabase or Clerk integration yet - those will come in future plans

