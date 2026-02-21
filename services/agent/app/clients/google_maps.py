from typing import Any

import httpx

from app.config import settings


class GeocodingResult:
    """Typed wrapper around Google Maps Geocoding API result."""

    def __init__(self, data: dict[str, Any]) -> None:
        self._data = data

    @property
    def place_id(self) -> str:
        return str(self._data.get("place_id", ""))

    @property
    def formatted_address(self) -> str:
        return str(self._data.get("formatted_address", ""))

    @property
    def latitude(self) -> float:
        return float(self._data["geometry"]["location"]["lat"])

    @property
    def longitude(self) -> float:
        return float(self._data["geometry"]["location"]["lng"])

    @property
    def address_components(self) -> list[dict[str, Any]]:
        return list(self._data.get("address_components", []))

    @property
    def partial_match(self) -> bool:
        return bool(self._data.get("partial_match", False))


async def geocode_venue(
    name: str,
    city: str | None = None,
    state: str | None = None,
    country: str | None = None,
) -> list[GeocodingResult]:
    """Geocode a venue using Google Maps Geocoding API."""
    address_parts = [p for p in [name, city, state, country] if p]
    address = ", ".join(address_parts)

    api_key = settings.google_maps_api_key
    if not api_key:
        return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": api_key},
        )

    if response.status_code != 200:
        return []

    data = response.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        return []

    return [GeocodingResult(r) for r in data.get("results", [])]


def extract_city(address_components: list[dict[str, Any]]) -> str | None:
    for component in address_components:
        types = component.get("types", [])
        if "locality" in types or "sublocality" in types:
            return str(component.get("long_name"))
    return None


def extract_state(address_components: list[dict[str, Any]]) -> str | None:
    for component in address_components:
        types = component.get("types", [])
        if "administrative_area_level_1" in types:
            return str(component.get("short_name") or component.get("long_name"))
    return None


def extract_country(address_components: list[dict[str, Any]]) -> str:
    for component in address_components:
        types = component.get("types", [])
        if "country" in types:
            return str(component.get("long_name", "Unknown"))
    return "Unknown"
