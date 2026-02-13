terraform {
  required_version = ">= 1.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "supabase" {
  access_token = var.supabase_access_token
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

resource "vercel_project_environment_variable" "clerk_publishable_key" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  value      = var.clerk_publishable_key
  target     = ["production", "preview"]
}

resource "vercel_project_environment_variable" "clerk_secret_key" {
  project_id = vercel_project.showcount.id
  key        = "CLERK_SECRET_KEY"
  value      = var.clerk_secret_key
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "clerk_sign_in_url" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_CLERK_SIGN_IN_URL"
  value      = "/sign-in"
  target     = ["production", "preview"]
}

resource "vercel_project_environment_variable" "clerk_sign_up_url" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_CLERK_SIGN_UP_URL"
  value      = "/sign-up"
  target     = ["production", "preview"]
}

# Supabase Project
resource "supabase_project" "showcount" {
  organization_id   = var.supabase_organization_id
  name              = "showcount"
  database_password = var.supabase_database_password
  region            = "us-east-1"
}

data "supabase_apikeys" "my_keys" {
  project_ref = supabase_project.showcount.id
}

# Supabase Environment Variables
resource "vercel_project_environment_variable" "supabase_url" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_SUPABASE_URL"
  value      = "https://${supabase_project.showcount.id}.supabase.co"
  target     = ["production", "preview"]
}

resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  value      = data.supabase_apikeys.my_keys.anon_key
  target     = ["production", "preview"]
  sensitive  = true
}
