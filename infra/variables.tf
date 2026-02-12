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
