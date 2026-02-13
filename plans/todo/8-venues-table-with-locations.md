# 8-venues-table-with-locations.md

- Add a new venues table that has the venue name and location data that is pulled from the OpenStreetMap API (this should at least include the city, state, country, and lat/lng)
- When a user is adding a show (either through the csv upload flow or edit flow), we should check the venue table to see if that venue exists (venue name, city, and state should be sufficient for a unique slug). If the venue doesn't exist in the venues table, make a call to the OpenStreetMap API to search for the venue. Take the top result if one is returned. Again, verify the venue is not in the venues table. If it's not there, add it and associate the venue with the user's show.
- The user shows table should have the venue name, city, state, and country columns removed and should instead just have a column that can be joined with the venues table to get all the venue information
