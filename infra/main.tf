terraform {
  required_version = ">= 1.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

resource "vercel_project" "showcount" {
  name      = var.project_name
  framework = "nextjs"

  root_directory = "app"

  git_repository = {
    type              = "github"
    repo              = "henryrobbins/showcount"
    production_branch = "main"
  }

  serverless_function_region = "iad1"
}
