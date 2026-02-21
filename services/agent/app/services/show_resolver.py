import logging
from typing import Any, cast

from app.clients.supabase import get_supabase
from app.services.show_id import generate_show_id

logger = logging.getLogger(__name__)


async def find_central_show(
    date: str,
    artist: str,
    venue_id: str,
) -> dict[str, Any] | None:
    """Find an existing central show by exact match."""
    supabase = get_supabase()

    result = (
        supabase.table("central_shows")
        .select("*")
        .eq("date", date)
        .eq("artist", artist)
        .eq("venue_id", venue_id)
        .maybe_single()
        .execute()
    )

    if result and result.data:
        return cast(dict[str, Any], result.data)
    return None


async def get_or_create_central_show(
    date: str,
    artist: str,
    venue_id: str,
) -> str | None:
    """Find or create a central show. Returns show_id or None."""
    if not date or not artist or not venue_id:
        return None

    # Check if this exact show exists
    existing = await find_central_show(date, artist, venue_id)
    if existing:
        return str(existing["show_id"])

    try:
        supabase = get_supabase()

        # Check for sequence numbering
        base_show_id = generate_show_id(date, artist, venue_id)
        result = (
            supabase.table("central_shows")
            .select("show_id")
            .like("show_id", f"{base_show_id}%")
            .execute()
        )

        existing_shows = result.data or []
        final_show_id = base_show_id
        if existing_shows:
            final_show_id = generate_show_id(
                date, artist, venue_id, len(existing_shows)
            )

        # Insert new central show
        insert_result = (
            supabase.table("central_shows")
            .insert(
                {
                    "show_id": final_show_id,
                    "date": date,
                    "artist": artist,
                    "venue_id": venue_id,
                }
            )
            .execute()
        )

        if insert_result.data:
            rows = cast(list[dict[str, Any]], insert_result.data)
            return str(rows[0]["show_id"])

    except Exception:
        logger.exception(
            "Error creating central show: %s / %s", artist, date
        )

    return None


async def resolve_shows_for_artists(
    date: str,
    artists: list[str],
    venue_id: str,
) -> list[str] | None:
    """Resolve central shows for all artists at a given show.

    Returns list of show_ids, or None if date/venue missing.
    """
    if not date or not venue_id:
        return None

    show_ids: list[str] = []
    for artist in artists:
        show_id = await get_or_create_central_show(date, artist, venue_id)
        if show_id:
            show_ids.append(show_id)

    return show_ids if show_ids else None
