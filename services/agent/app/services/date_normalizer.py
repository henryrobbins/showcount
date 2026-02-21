import json
import logging

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You normalize raw date strings into ISO format (YYYY-MM-DD).

You will receive a JSON object with:
- "dates": array of raw date strings
- "year_context": optional year hint from the user (e.g. "2025", "2024-2025")

Rules:
- Convert each date to YYYY-MM-DD format
- If a date has no year and year_context provides one, use it
- If a date has no year and no year_context, return null
- For Obsidian dates like [[08-06-16]], interpret as MM-DD-YY
- For date ranges like "5/16-5/18", use the start date
- For ambiguous formats, prefer MM/DD (US-style)
- If a date cannot be parsed, return null

Return a JSON array of strings or nulls, same length and order as the input dates array.
Return ONLY the JSON array.\
"""


async def normalize_dates(
    raw_dates: list[str],
    year_context: str = "",
) -> list[str | None]:
    """Batch normalize raw date strings to YYYY-MM-DD via Claude Haiku."""
    if not raw_dates:
        return []

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    payload = {"dates": raw_dates, "year_context": year_context}

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": json.dumps(payload)}],
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

    results: list[str | None] = json.loads(text)

    if len(results) != len(raw_dates):
        logger.warning(
            "Date normalization returned %d results for %d inputs",
            len(results),
            len(raw_dates),
        )
        # Pad or truncate to match
        while len(results) < len(raw_dates):
            results.append(None)
        results = results[: len(raw_dates)]

    return results
