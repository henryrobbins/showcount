# 4-csv-upload-flow.md

- Initialize Supabase project via Terraform for database
- On the /user/[username] route, provide the user with the option to import show data if they don't have any shows yet. This should link to a route /upload that allows the user to upload data to their current account
- On the /upload page, there should be a single option to upload data via a CSV file. Details of the CSV schema are in the CSV Schema section below
- If the CSV file is not in the proper format, the CSV file can be rejected with a minimal error message.
- If the CSV is in the proper format, a table should be displayed showing the user the data they are about to upload.
- Finally, the user should be able to hit a confirm/submit button to upload the show attendance data. This should populate the supabase database.
- The supabase database should have a single table called shows. In addition to the columns from the CSV schema, it should include a column for the user Clerk ID to link shows to a given user.
- If a user has already uploaded shows, the table with their shows should be displayed on their user profile.

## CSV Schema

The CSV file should have the following headers: `date,artist,venue,city,state,country`. The `date` and `artist` must be specified for each row. The other columns are optional. The `artist` column may have multiple artists separated by the `+` separator. For example, `Umphrey's McGee + Big Something` should be parsed as two artists: "Umphrey's McGee" and "Big Something".

