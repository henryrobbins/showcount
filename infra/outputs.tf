output "project_id" {
  description = "The ID of the Vercel project"
  value       = vercel_project.showcount.id
}

output "project_name" {
  description = "The name of the Vercel project"
  value       = vercel_project.showcount.name
}

output "production_domain" {
  description = "The production domain for the project"
  value       = "https://${var.project_name}.vercel.app"
}
