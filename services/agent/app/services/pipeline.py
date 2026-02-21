import asyncio
import logging
from collections.abc import AsyncGenerator

from app.models.parse import ParsedUserShow, ProcessedUserShow
from app.services.claude_parser import parse_file_to_shows
from app.services.date_normalizer import normalize_dates
from app.services.show_resolver import resolve_shows_for_artists
from app.services.venue_resolver import get_or_create_venue

logger = logging.getLogger(__name__)

BATCH_SIZE = 10


async def _process_single_show(
    order: int,
    show: ParsedUserShow,
    normalized_date: str | None,
) -> ProcessedUserShow:
    """Process a single parsed show: resolve venue and central shows."""
    try:
        # Resolve venue
        venue_id = await get_or_create_venue(
            name=show.venue,
            city=show.city or None,
            state=show.state or None,
            country=show.country or None,
        )

        # Resolve central shows (one per artist)
        show_ids: list[str] | None = None
        if normalized_date and venue_id:
            show_ids = await resolve_shows_for_artists(
                date=normalized_date,
                artists=show.artists,
                venue_id=venue_id,
            )

        return ProcessedUserShow(
            order=order,
            date=normalized_date,
            artists=show.artists,
            show_ids=show_ids,
            venue_id=venue_id,
            notes=show.notes or None,
            rating=show.rating or None,
        )

    except Exception:
        logger.exception("Error processing show %d: %s", order, show.artists)
        return ProcessedUserShow(
            order=order,
            date=normalized_date,
            artists=show.artists,
            show_ids=None,
            venue_id=None,
            notes=show.notes or None,
            rating=show.rating or None,
        )


async def process_shows(
    content: str,
    user_prompt: str = "",
) -> AsyncGenerator[ProcessedUserShow, None]:
    """Full pipeline: parse file, normalize dates, resolve venues/shows.

    Yields ProcessedUserShows in original order, buffering as needed.
    """
    # Step 1: Parse file into raw shows
    parsed_shows = await parse_file_to_shows(content, user_prompt)
    if not parsed_shows:
        return

    # Step 2a: Batch normalize all dates
    raw_dates = [s.date for s in parsed_shows]
    normalized_dates = await normalize_dates(raw_dates, user_prompt)

    # Step 2b+2c: Process shows in batches, yielding in order
    results: dict[int, ProcessedUserShow] = {}
    next_to_yield = 0
    total = len(parsed_shows)

    for batch_start in range(0, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)

        tasks = [
            _process_single_show(i, parsed_shows[i], normalized_dates[i])
            for i in range(batch_start, batch_end)
        ]

        batch_results = await asyncio.gather(*tasks)

        for result in batch_results:
            results[result.order] = result

        # Yield consecutive completed results
        while next_to_yield in results:
            yield results.pop(next_to_yield)
            next_to_yield += 1
