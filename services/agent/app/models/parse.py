from pydantic import BaseModel


class ParsedUserShow(BaseModel):
    """Raw parsed output from Claude (Step 1)."""

    date: str
    artists: list[str]
    venue: str
    city: str
    state: str
    country: str
    notes: str
    rating: str


class ProcessedUserShow(BaseModel):
    """Fully resolved show ready for frontend review (Step 2)."""

    order: int
    date: str | None
    artists: list[str]
    show_ids: list[str] | None
    venue_id: str | None
    notes: str | None
    rating: str | None
