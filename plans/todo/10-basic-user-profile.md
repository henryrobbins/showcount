# 10-basic-user-profile.md

- Add user table to store basic account information
- Should include a column with the Clerk user id
- A user should only be able to edit their own profile information
- On the /user/[username] page, there should be an option to edit your profile if it's your use account and you're signed in. Clicking edit should pop up a modal where you can edit your account information and then click save.
- Profile information should include the following **optional** fields:
  - caption
  - city
  - email
  - "Song I'm Chasing"
  - "Band I'm Chasing"
  - "Favorite Show"
  - "Favorite Venue"
  - CashOrTrade account: (e.g. https://cashortrade.org/profile/w3jane)
  - Instagram account
  - X account
  - Facebook account
- Only profile information that has been filled out should be visible
- Amend the new user flow to direct new users to fill out this account information
