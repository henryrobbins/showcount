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
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "supabase" {
  access_token = var.supabase_access_token
}

provider "google" {
  project               = var.gcp_project_id
  region                = var.gcp_region
  zone                  = var.gcp_zone
  user_project_override = true
  billing_project       = var.gcp_project_id
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

# =============================================================================
# GOOGLE MAPS PLATFORM
# =============================================================================

# Enable Google Maps Platform APIs
resource "google_project_service" "maps_apis" {
  for_each = toset([
    "apikeys.googleapis.com",           # API Keys API (required to create keys)
    "maps-backend.googleapis.com",      # Maps JavaScript API
    "places-backend.googleapis.com",    # Places API
    "geocoding-backend.googleapis.com", # Geocoding API
  ])

  project = var.gcp_project_id
  service = each.value

  disable_on_destroy = false
}

# Frontend API Key - For browser-based Maps, Places, and Geocoding APIs
resource "google_apikeys_key" "maps_frontend_key" {
  name         = "maps-frontend-key-${var.gcp_region}"
  display_name = "Google Maps Platform Frontend API Key"
  project      = var.gcp_project_id

  restrictions {
    # API restrictions - Frontend APIs only
    api_targets {
      service = "maps-backend.googleapis.com"
    }
    api_targets {
      service = "places-backend.googleapis.com"
    }
    api_targets {
      service = "geocoding-backend.googleapis.com"
    }

    # Browser restrictions - HTTP referrer restrictions for web applications
    browser_key_restrictions {
      allowed_referrers = [
        "https://showcount.com/*",
        "https://*.showcount.com/*",
        "http://localhost:3000/*",
        "http://127.0.0.1:3000/*",
        "https://*.ngrok-free.app/*",
      ]
    }
  }

  depends_on = [google_project_service.maps_apis]
}

# Backend API Key - For server-side Geocoding and Places APIs
resource "google_apikeys_key" "maps_backend_key" {
  name         = "maps-backend-key-${var.gcp_region}"
  display_name = "Google Maps Platform Backend API Key"
  project      = var.gcp_project_id

  restrictions {
    # API restrictions - Backend APIs
    api_targets {
      service = "geocoding-backend.googleapis.com"
    }
    api_targets {
      service = "places-backend.googleapis.com"
    }
  }

  depends_on = [google_project_service.maps_apis]
}

# Google Maps API Environment Variables
resource "vercel_project_environment_variable" "google_maps_api_key" {
  project_id = vercel_project.showcount.id
  key        = "GOOGLE_MAPS_API_KEY"
  value      = google_apikeys_key.maps_backend_key.key_string
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "google_maps_api_key_client" {
  project_id = vercel_project.showcount.id
  key        = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
  value      = google_apikeys_key.maps_frontend_key.key_string
  target     = ["production", "preview"]
  sensitive  = true
}
