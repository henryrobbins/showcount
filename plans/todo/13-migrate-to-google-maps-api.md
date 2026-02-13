# 13-migrate-to-google-maps-api.md

- OpenStreetMap rate limit is too restrictive (1 request per second)
- Switch to using Google Maps API to fetch location information
- Use a bulk endpoint if they provide one
- Use Terraform to create Google Maps API keys with necessary tools enabled. Provide the API keys to Vercel and update env configuration files for local development
