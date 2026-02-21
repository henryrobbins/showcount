import re


def normalize_artist_name(artist: str) -> str:
    """Normalize artist name to kebab-case slug.

    Example: "Trey Anastasio" -> "trey-anastasio"
    Example: "moe." -> "moe"
    """
    trimmed = artist.strip()
    normalized = trimmed.lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    normalized = re.sub(r"-+", "-", normalized)
    normalized = normalized.strip("-")
    return normalized


def generate_show_id(
    date: str,
    artist: str,
    venue_id: str,
    sequence: int | None = None,
) -> str:
    """Generate a unique show_id slug.

    Format: {date}-{artist-slug}-{venue_id}[-{sequence}]
    """
    artist_slug = normalize_artist_name(artist)
    base_id = f"{date}-{artist_slug}-{venue_id}"

    if sequence is not None and sequence > 0:
        return f"{base_id}-{sequence}"

    return base_id
