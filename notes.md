LATEST UPDATE
---
the biggest new feature:
**command piping:**

- commands can now be piped by adding " | p/command" to the end of it. for example: "p/test | p/test | p/test"
- commands that can now be piped, and their effects:
  - p/test can now be piped to itself, displaying the full time it took to execute all p/tests at the end

**actual content:**

- command data has been overhauled
  - whitelists are now comprised of users, roles, channels, and guilds rather than just users
  - blacklists now exist (exact opposite of whitelists)
  - descriptions are separated into a short and long form, one for display under a slash command and one for all other cases
  - commands can now have categories
- bots can no longer execute any commands. this was just yet another value i had to think about if it would cause problems or not

**technical details:**

- javascript -> typescript
- running off of bun now instead of nodejs
- constant resources have been separated into a /constant folder
- user data has been transformed into a SQL database
- guild config values are now separated by category
- most processes now host a server for easy inter-process communication
- data passed to commands is no longer a list of 4 arguments, instead just one object you can choose what you want from. that also lets me reasonably pass a LOT more data to them
- im no longer using the slash command builders because they are annoying and i hate them i hate them i hate them get them out of my sight
- voice connections are now managed by GuildVoiceManagers which automatically create audio players