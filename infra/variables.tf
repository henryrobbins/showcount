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

variable "gcp_project_id" {
  description = "The GCP project ID where resources will be created"
  type        = string
}

variable "gcp_region" {
  description = "The default GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "The default GCP zone for resources"
  type        = string
  default     = "us-central1-a"
}
