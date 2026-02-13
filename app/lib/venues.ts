import { createClient } from "@/lib/supabase/server";
import { searchVenue, extractCity, extractCountry } from "@/lib/osm";
import type { VenueSearchParams, VenueInsert } from "@/types/venue";
import type { Database } from "@/types/database";

export type VenueStatus = 
  | "existing" 
  | "created_with_osm" 
  | "created_without_osm" 
  | "failed";

export interface VenueResult {
  venueId: string | null;
  status: VenueStatus;
  venue?: Database["public"]["Tables"]["venues"]["Row"];
}

/**
 * Find an existing venue in the database
 * Matching logic: requires name, city, and country to match exactly
 */
export async function findVenue(
  params: VenueSearchParams
): Promise<Database["public"]["Tables"]["venues"]["Row"] | null> {
  const { name, city, country } = params;

  // Require at least one field
  if (!name && !city && !country) {
    return null;
  }

  const supabase = await createClient();

  // Build query with exact matching
  let query = supabase.from("venues").select("*").eq("name", name);

  // For city and country, handle null values explicitly
  if (city) {
    query = query.eq("city", city);
  } else {
    query = query.is("city", null);
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
 * Create a new venue by fetching data from OpenStreetMap
 */
export async function createVenueFromOSM(
  params: VenueSearchParams
): Promise<Database["public"]["Tables"]["venues"]["Row"] | null> {
  const { name, city, country } = params;

  try {
    // Search OSM for the venue
    const results = await searchVenue(name, city, country);

    if (results.length === 0) {
      console.log("No OSM results found for venue:", params);
      // Create venue without OSM data
      return await createVenueWithoutOSM(params);
    }

    // Take the top result
    const topResult = results[0];

    // Extract location data
    const osmCity = extractCity(topResult.address);
    const osmCountry = extractCountry(topResult.address);

    // Use provided values, fall back to OSM values
    const venueInsert: VenueInsert = {
      name,
      city: city || osmCity,
      country: country || osmCountry || "Unknown",
      latitude: topResult.lat ? Number.parseFloat(topResult.lat) : null,
      longitude: topResult.lon ? Number.parseFloat(topResult.lon) : null,
      osm_place_id: topResult.place_id,
      osm_display_name: topResult.display_name,
    };

    // Check if venue already exists (race condition protection)
    const existing = await findVenue({
      name: venueInsert.name,
      city: venueInsert.city,
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
    console.error("Error creating venue from OSM:", error);
    return await createVenueWithoutOSM(params);
  }
}

/**
 * Create a venue without OSM data (fallback when OSM fails)
 */
async function createVenueWithoutOSM(
  params: VenueSearchParams
): Promise<Database["public"]["Tables"]["venues"]["Row"] | null> {
  const { name, city, country } = params;

  try {
    // Check if venue already exists
    const existing = await findVenue(params);
    if (existing) {
      return existing;
    }

    const venueInsert: VenueInsert = {
      name,
      city: city || null,
      country: country || "Unknown",
      latitude: null,
      longitude: null,
      osm_place_id: null,
      osm_display_name: null,
    };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .insert(venueInsert as any)
      .select()
      .single();

    if (error) {
      console.error("Error inserting venue without OSM:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating venue without OSM:", error);
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
  const { name, city, country } = params;

  // USA venues require all three fields
  if (country === "USA" && (!name || !city)) {
    console.error("USA venues require name, city, and country");
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

  // Create new venue with OSM data
  const newVenue = await createVenueFromOSM(params);
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
  const { name, city, country } = params;

  // Validate parameters
  if (country === "USA" && (!name || !city)) {
    console.error("USA venues require name, city, and country");
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

  // Try to create venue with OSM data
  try {
    const results = await searchVenue(name, city, country);

    if (results.length > 0) {
      // OSM data found
      const newVenue = await createVenueFromOSM(params);
      if (newVenue) {
        return {
          venueId: newVenue.id,
          status: "created_with_osm",
          venue: newVenue,
        };
      }
    }

    // No OSM data found, create without coordinates
    const venueWithoutOSM = await createVenueWithoutOSM(params);
    if (venueWithoutOSM) {
      return {
        venueId: venueWithoutOSM.id,
        status: "created_without_osm",
        venue: venueWithoutOSM,
      };
    }
  } catch (error) {
    console.error("Error in getOrCreateVenueWithStatus:", error);
  }

  return { venueId: null, status: "failed" };
}
