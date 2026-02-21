import logging
from typing import Any, cast

from app.clients.google_maps import (
    extract_city,
    extract_country,
    extract_state,
    geocode_venue,
)
from app.clients.supabase import get_supabase

logger = logging.getLogger(__name__)


async def find_venue(
    name: str,
    city: str | None = None,
    state: str | None = None,
    country: str | None = None,
) -> dict[str, Any] | None:
    """Find an existing venue by exact match (null-aware)."""
    if not name:
        return None

    supabase = get_supabase()
    query = supabase.table("venues").select("*").eq("name", name)

    if city:
        query = query.eq("city", city)
    else:
        query = query.is_("city", "null")

    if state:
        query = query.eq("state", state)
    else:
        query = query.is_("state", "null")

    if country:
        query = query.eq("country", country)
    else:
        query = query.is_("country", "null")

    result = query.maybe_single().execute()
    if result and result.data:
        return cast(dict[str, Any], result.data)
    return None


async def get_or_create_venue(
    name: str,
    city: str | None = None,
    state: str | None = None,
    country: str | None = None,
) -> str | None:
    """Find or create a venue. Returns venue_id or None."""
    if not name:
        return None

    # Try to find existing
    existing = await find_venue(name, city, state, country)
    if existing:
        return str(existing["id"])

    # Geocode via Google Maps
    try:
        results = await geocode_venue(name, city, state, country)

        venue_insert: dict[str, Any] = {
            "name": name,
            "city": city,
            "state": state,
            "country": country or "Unknown",
            "latitude": None,
            "longitude": None,
            "google_place_id": None,
            "google_formatted_address": None,
            "osm_place_id": None,
            "osm_display_name": None,
        }

        if results:
            top = results[0]
            if top.partial_match:
                logger.warning("Partial match for venue: %s", name)

            gmaps_city = extract_city(top.address_components)
            gmaps_state = extract_state(top.address_components)
            gmaps_country = extract_country(top.address_components)

            venue_insert.update(
                {
                    "city": city or gmaps_city,
                    "state": state or gmaps_state,
                    "country": country or gmaps_country,
                    "latitude": top.latitude,
                    "longitude": top.longitude,
                    "google_place_id": top.place_id,
                    "google_formatted_address": top.formatted_address,
                }
            )

        # Race condition check: re-find after geocoding
        recheck = await find_venue(
            name,
            str(venue_insert["city"]) if venue_insert["city"] else None,
            str(venue_insert["state"]) if venue_insert["state"] else None,
            str(venue_insert["country"]) if venue_insert["country"] else None,
        )
        if recheck:
            return str(recheck["id"])

        supabase = get_supabase()
        result = supabase.table("venues").insert(venue_insert).execute()

        if result.data:
            row = cast(list[dict[str, Any]], result.data)
            return str(row[0]["id"])

    except Exception:
        logger.exception("Error creating venue: %s", name)

    return None
