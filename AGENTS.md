# AGENTS.md

This file should be read in its entirety before completing any task. This documentation should be updated to reflect any changes made in the repository as necessary.

## Project Overview

This repo maintains the source-code and backend service for a web application called showcount. The primary function of showcount is to allow users to track and share the concerts (shows) they have attended.

## MVP

The MVP needs to offer the following functionality:

- Account create/sign-in/sign-out flow with Clerk
- Upload show attendance data from `.csv` data
- View show attendance table
- Edit show attendance table (add/remove/edit)

## Local vs. Production

It is crucial to have appropriate development tools to facilitate running the application and running tests locally. As this tooling is added, please update the documentation here.

## Repository Structure

```
├── app/           # Next.js frontend + API routes
├── services/      # Fast API backend services
└── infra/         # Terraform Infrastructure (production only, local state)
```

## Architecture

See [ARCHITECTURE](/ARCHITECTURE.md). Ensure this file is read prior to planning.

## Style Guide

See [STYLE](/STYLE.md). Ensure this file is read prior to implementation.

## UI/UX Design

See [DESIGN](/DESIGN.md). Ensure this file is read prior to planning or implementation of plans that will impact UI/UX.

## Development

See [DEVELOPMENT](/DEVELOPMENT.md). Ensure this file is read for guidance on local development, environment management, and testing.

## Task Management

See [TODO](/TODO.md)

