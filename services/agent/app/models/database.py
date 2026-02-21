from pydantic import BaseModel


class Venue(BaseModel):
    id: str
    name: str
    city: str | None
    state: str | None
    country: str | None
    latitude: float | None
    longitude: float | None
    google_place_id: str | None
    google_formatted_address: str | None
    osm_place_id: str | None
    osm_display_name: str | None
    created_at: str
    updated_at: str


class CentralShow(BaseModel):
    id: str
    show_id: str
    date: str
    artist: str
    venue_id: str
    created_at: str
    updated_at: str
