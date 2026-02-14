import { createClient } from "@/lib/supabase/server";
import { searchVenue as searchVenueOSM, extractCity as extractCityOSM, extractState as extractStateOSM, extractCountry as extractCountryOSM } from "@/lib/osm";
import { geocodeVenue, extractCity, extractState, extractCountry } from "@/lib/google-maps";
import type { VenueSearchParams, VenueInsert, GoogleMapsGeocodingResult } from "@/types/venue";
import type { Database } from "@/types/database";

export type VenueStatus = 
  | "existing" 
  | "created_with_geocode"
  | "created_without_geocode" 
  | "failed";

export interface VenueResult {
  venueId: string | null;
  status: VenueStatus;
  venue?: Database["public"]["Tables"]["venues"]["Row"];
}

/**
 * Find an existing venue in the database
 * Matching logic: requires name, city, state, and country to match exactly
 */
export async function findVenue(
  params: VenueSearchParams
): Promise<Database["public"]["Tables"]["venues"]["Row"] | null> {
  const { name, city, state, country } = params;

  // Require at least one field
  if (!name && !city && !state && !country) {
    return null;
  }

  const supabase = await createClient();

  // Build query with exact matching
  let query = supabase.from("venues").select("*").eq("name", name);

  // For city, state, and country, handle null values explicitly
  if (city) {
    query = query.eq("city", city);
  } else {
    query = query.is("city", null);
  }

  if (state) {
    query = query.eq("state", state);
  } else {
    query = query.is("state", null);
  }

  if (country) {
    query = query.eq("country", country);
  } else {
    query = query.is("country", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error finding venue:", error);
    return null;
  }

  return data;
}

/**
 * Create a new venue by fetching data from Google Maps
 */
export async function createVenueFromGoogleMaps(
  params: VenueSearchParams
): Promise<Database["public"]["Tables"]["venues"]["Row"] | null> {
  const { name, city, state, country } = params;

  try {
    // Search Google Maps for the venue
    const results = await geocodeVenue(params);

    if (results.length === 0) {
      console.log("No Google Maps results found for venue:", params);
      // Create venue without geocode data
      return await createVenueWithoutGeocode(params);
    }

    // Take the top result
    const topResult = results[0];

    // Log warning if partial match
    if (topResult.partial_match) {
      console.warn(`Partial match for venue: ${name}`, topResult.formatted_address);
    }

    // Extract location data
    const gmapsCity = extractCity(topResult.address_components);
    const gmapsState = extractState(topResult.address_components);
    const gmapsCountry = extractCountry(topResult.address_components);

    // Use provided values, fall back to Google Maps values
    const venueInsert: VenueInsert = {
      name,
      city: city || gmapsCity,
      state: state || gmapsState,
      country: country || gmapsCountry || "Unknown",
      latitude: topResult.geometry.location.lat,
      longitude: topResult.geometry.location.lng,
      google_place_id: topResult.place_id,
      google_formatted_address: topResult.formatted_address,
      osm_place_id: null,
      osm_display_name: null,
    };

    // Check if venue already exists (race condition protection)
    const existing = await findVenue({
      name: venueInsert.name,
      city: venueInsert.city,
      state: venueInsert.state,
      country: venueInsert.country,
    });

    if (existing) {
      return existing;
    }

    // Insert into database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .insert(venueInsert as any)
      .select()
      .single();

    if (error) {
      console.error("Error inserting venue:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating venue from Google Maps:", error);
    return await createVenueWithoutGeocode(params);
  }
}

/**
 * Create a venue without geocode data (fallback when Google Maps fails)
 */
async function createVenueWithoutGeocode(
  params: VenueSearchParams
): Promise<Database["public"]["Tables"]["venues"]["Row"] | null> {
  const { name, city, state, country } = params;

  try {
    // Check if venue already exists
    const existing = await findVenue(params);
    if (existing) {
      return existing;
    }

    const venueInsert: VenueInsert = {
      name,
      city: city || null,
      state: state || null,
      country: country || "Unknown",
      latitude: null,
      longitude: null,
      osm_place_id: null,
      osm_display_name: null,
      google_place_id: null,
      google_formatted_address: null,
    };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .insert(venueInsert as any)
      .select()
      .single();

    if (error) {
      console.error("Error inserting venue without geocode:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating venue without geocode:", error);
    return null;
  }
}

/**
 * Get or create a venue - finds existing or creates new
 * @param params - Venue search parameters
 * @returns Venue ID or null if creation failed
 */
export async function getOrCreateVenue(
  params: VenueSearchParams
): Promise<string | null> {
  // Validate parameters
  const { name, city, state, country } = params;

  // USA venues require all fields
  if (country === "USA" && (!name || !city || !state)) {
    console.error("USA venues require name, city, state, and country");
    return null;
  }

  // All venues require at least a name
  if (!name) {
    console.error("Venue name is required");
    return null;
  }

  // Try to find existing venue
  const existing = await findVenue(params);
  if (existing) {
    return existing.id;
  }

  // Create new venue with Google Maps data
  const newVenue = await createVenueFromGoogleMaps(params);
  if (newVenue) {
    return newVenue.id;
  }

  return null;
}

/**
 * Get or create a venue with detailed status information
 * @param params - Venue search parameters
 * @returns Venue result with status
 */
export async function getOrCreateVenueWithStatus(
  params: VenueSearchParams
): Promise<VenueResult> {
  const { name, city, state, country } = params;

  // Validate parameters
  if (country === "USA" && (!name || !city || !state)) {
    console.error("USA venues require name, city, state, and country");
    return { venueId: null, status: "failed" };
  }

  if (!name) {
    console.error("Venue name is required");
    return { venueId: null, status: "failed" };
  }

  // Try to find existing venue
  const existing = await findVenue(params);
  if (existing) {
    return {
      venueId: existing.id,
      status: "existing",
      venue: existing,
    };
  }

  // Try to create venue with Google Maps data
  try {
    const results = await geocodeVenue(params);

    if (results.length > 0) {
      // Google Maps data found
      const newVenue = await createVenueFromGoogleMaps(params);
      if (newVenue) {
        return {
          venueId: newVenue.id,
          status: "created_with_geocode",
          venue: newVenue,
        };
      }
    }

    // No Google Maps data found, create without coordinates
    const venueWithoutGeocode = await createVenueWithoutGeocode(params);
    if (venueWithoutGeocode) {
      return {
        venueId: venueWithoutGeocode.id,
        status: "created_without_geocode",
        venue: venueWithoutGeocode,
      };
    }
  } catch (error) {
    console.error("Error in getOrCreateVenueWithStatus:", error);
  }

  return { venueId: null, status: "failed" };
}
