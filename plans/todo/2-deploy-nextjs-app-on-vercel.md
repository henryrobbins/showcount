# 2-deploy-nextjs-app-on-vercel.md

- Create Terraform files in `/infra` to provision Vercel infrastructure for deploying the Next.JS application
- The application should automatically deploy when pushed to the `main` branch
- Environment management:
  - Infrastructure secrets should be localized to the `/infra` directory
  - Create `.tfvars.example` file with example variable definitions
  - Terraform state will be stored locally (not in remote backend)
  - This is an open-source project - others should be able to do local development without access to infrastructure secrets
  - Only project maintainers will use the `/infra` directory for infrastructure changes
- Update [README](/README.md) with:
  - Deployment information
  - Infrastructure setup instructions (for maintainers)
  - Docker usage instructions
