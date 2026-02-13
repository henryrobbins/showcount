# 6-show-list-edit-page.md

- The /user/[username] page should have a link to a new /user/edit page that allows for editing the user's show list. If the user has no shows, this link should not appear. If they are on the /user/edit page without any shows, it should redirect them to the CSV upload page.
- **Add show:** There should be a button to add a recent show that launches a modal with the necessary show information: date, artist, venue, city, state, country (only date and artist are required). Remember that multiple artists can be added to a single show.
- **Remove show:** The user should be able to select existing shows from the show list and a button should let them delete these shows with a modal that pops up to request confirmation. There should be an easy way to select/de-select all show rows to make it easy to delete all shows.
- **Edit show:** A user should be able to click on a show row to bring up an edit modal that allows them to edit any of the information about that show. There should be a save button to close the modal.

