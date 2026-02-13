# 11-custom-rating-system.md

- Add a rating field to the user_shows table that can be any value
- Part of a user's account can be specifying a custom rating system
- This custom rating system can be enabled or disabled. The rating column is only shown if ratings are enabled on the user's profile
- Custom ratings can take one of the following forms:
  - The user can specify an ordered list of ratings. E.g.
    - `AAA,AA,A,B,C,D,F`
    - `A,B,C,D,F`
    - `*****,****,***,**,*`
  - The user can specify a numeric range and direction. E.g.
    - 1-3 where 1 is best
    - 1-10 where 10 is best
    - 1-5 where 5 is best
  - The user can specify unbounded numeric score and direction. E.g
    - lower score is better
    - higher score is better
