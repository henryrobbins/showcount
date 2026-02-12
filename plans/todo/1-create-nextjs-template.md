# 1-create-nextjs-template.md

- Create a template Next.JS application in `/app`
- Reference [ARCHITECTURE](/ARCHITECTURE.md) for framework decisions
- The application should contain a single index screen that says "SHOWCOUNT" in the middle with a sub-caption "Concert tracking. Coming soon." Follow the [DESIGN](/DESIGN.md) guidelines.
- Create a Docker container for the web app that can be run locally
- There should be a Makefile in `/app` with the following targets:
  - `make dev` - Run development server
  - `make build` - Build the application
  - `make clean` - Clean build artifacts
- Update [README](/README.md) with:
  - Project description
  - Prerequisites (Node >=22, bun)
  - Local development setup instructions
  - Available make commands
