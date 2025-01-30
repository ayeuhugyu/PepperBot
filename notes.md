LATEST UPDATE
---
**actual content:**

- command data has been overhauled
  - whitelists are now comprised of users, roles, channels, and guilds rather than just users
  - blacklists now exist (exact opposite of whitelists)
  - descriptions are separated into a short and long form, one for display under a slash command and one for all other cases
  - commands can now have categories

**technical details:**

- javascript -> typescript
- running off of bun now instead of nodejs
- constant resources have been separated into a /constant folder
- user data has been transformed into a SQL database
- guild config values are now separated by category