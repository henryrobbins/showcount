variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Name of the Vercel project"
  type        = string
  default     = "showcount"
}

variable "clerk_publishable_key" {
  description = "Clerk publishable key for production (pk_live_*)"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key for production (sk_live_*)"
  type        = string
  sensitive   = true
}

variable "supabase_access_token" {
  description = "Supabase personal access token for Terraform provider"
  type        = string
  sensitive   = true
}

variable "supabase_organization_id" {
  description = "Supabase organization ID"
  type        = string
}

variable "supabase_database_password" {
  description = "Supabase database password"
  type        = string
  sensitive   = true
}

variable "google_maps_api_key" {
  description = "Google Maps Platform API key (server-side)"
  type        = string
  sensitive   = true
}

variable "google_maps_api_key_client" {
  description = "Google Maps Platform API key (client-side)"
  type        = string
  sensitive   = true
}
