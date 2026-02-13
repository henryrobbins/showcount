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
