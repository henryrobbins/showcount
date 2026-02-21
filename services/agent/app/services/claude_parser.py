import json
import logging

import anthropic

from app.config import settings
from app.models.parse import ParsedUserShow

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a concert data parser. Given raw text containing a user's concert attendance history, \
extract every show into structured JSON.

Return a JSON array of objects. Each object represents one show attendance entry with these fields:
- "date": the raw date string exactly as written (e.g. "1/30", "[[08-06-16]]", "2/5", "May 23, 2024")
- "artists": array of artist/band names for this show entry. If multiple artists played the same \
show (openers, co-headliners, "+"), list them all. Parse "Artist1 + Artist2" as separate artists.
- "venue": the venue name exactly as written
- "city": city name if provided, empty string if not
- "state": state/province if provided, empty string if not
- "country": country if provided, empty string if not
- "notes": any additional notes, comments, or metadata (e.g. "SOLD OUT", "Summer Camp", special guests)
- "rating": any rating if provided, empty string if not

Rules:
- Preserve the original order of shows as they appear in the text
- For CSV/table formats, use column headers to map fields
- For "City, State, Country" location formats, split into separate fields
- For "City, State" (USA-style), infer country as "USA"
- For festival entries with date ranges (e.g. "5/16-5/18"), use the start date
- For Obsidian-style dates like [[08-06-16]], keep them as-is in the date field
- One entry per show attendance row. If the source lists separate rows per artist at the same \
festival day, keep them as separate entries
- Do NOT invent or assume data that isn't in the source text
- If a field is missing or unclear, use an empty string

Return ONLY the JSON array, no other text.\
"""


async def parse_file_to_shows(
    content: str,
    user_prompt: str = "",
) -> list[ParsedUserShow]:
    """Parse file content into structured show data using Claude."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    user_message = f"Here is my concert history data:\n\n{content}"
    if user_prompt:
        user_message += f"\n\nAdditional context: {user_prompt}"

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16384,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    text = response.content[0].text  # type: ignore[union-attr]

    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        first_newline = text.index("\n")
        text = text[first_newline + 1 :]
    if text.endswith("```"):
        text = text[: text.rfind("```")]
    text = text.strip()

    raw_shows: list[dict[str, object]] = json.loads(text)
    shows = [ParsedUserShow.model_validate(s) for s in raw_shows]

    logger.info("Parsed %d shows from file", len(shows))
    return shows
