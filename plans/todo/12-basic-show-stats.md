# 12-basic-show-stats.md

- Basic show stats above the show table on `/user/[username]`
  - Total number of shows
  - Total number of artists
  - Total number of venues
  - Total number of cities
  - Total number of states
  - Total number of countries
- Add new user stats pages:
  - `/user/[username]/stats/artists`: number of times they've seen every artist
  - `/user/[username]/stats/venues`: number of times they've been at every venue
  - `/user/[username]/stats/places`: three tables with number of times in every city, state, and country
  - `/user/[username]/stats/dates` three tables with number of shows per year, month, and day of week
- All show statistics should be computed according to the user_shows table.
  - If a user put `Umphrey's McGee + Goose` in a single show entry, that should count as a single show for the purposes of all counts, with the exception of the artist counts. This would count towards 1 Umphrey's McGee show *and* one Goose show.
