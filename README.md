finally got around to at least starting to rewrite this

basically:\
this is a discord bot\
it was developed for my [discord server](https://discord.gg/UMaFC6tjKu)\
if i'm being honest, i don't know what my goal was\
i just wanted to make a thing\
its literally just whatever i could come up with to occupy my time

if you would like more detailed update logs than the commit message, join the discord server (or check notes.txt sometimes that has it)

i figured if someone actually wants to understand what any of this code does i should *probably* make some sort of explanation, so that's exactly what the rest of this is.
#### <u>***quick summary of features***</u>
___

- text AND slash commands
  - unlimited soundboards
  - playing youtube url's
  - reaction roles
  - chatbubble creation
  - deepwoken equipment godroll calculator
  - embed creation
  - guild configuration (for pepperbot features)
  - a lot of dev-only commands for updates and other things like that
- a website that interacts with the bot
  - statistics
  - log viewing
- "diabolical events" (stuff that happens randomly)
- gpt chat responses (and the ability to set custom prompts for it)
#### <u>***how do the files interact with eachother***</u> 
___
so honestly the best way i can describe this thing is via this diagram
```
          ┏ site.js
index.js ━┫
          ┗ sharder.js
            ┗ bot.js
```
everything is forked.
- index.js just forks site.js and sharder.js, and if they error it restarts them
- site.js hosts and handles requests to the site
- sharder.js uses discord's sharding to host the bot
- bot.js is what each shard is running (so there's actually as many forked bot.js's as there is shards)

#### <u>***quick description of each of the files in src/lib***</u> 
___

- `src/lib/adobe.js`
  - this contains two functions for
    - searching adobe stock
    - cleaning up the resulting response into something that doesn't have a bunch of data that i don't really need
  - this is only used by the cquery command
- `src/lib/commands.js`
  - this file exports 3 collections of the commands, one without aliases, one with only the actual commands, and finally one with everything.
    - these are mainly used by the messageCreate and interactionCreate event listeners to recognize whether or not a command is real and to execute it
- `src/lib/commonRegex.js`
  - this file contains a bunch of regex that i expect i may or may not use in the future or in multiple files
    - all discord mentioning regex
    - youtube URL regex
    - ipv4 regex
    - ISO8601 regex
- `src/lib/deepwokenBiasedBuildIdea.js`
  - contains a bunch of values and weights and whatever for creating weighted random build ideas
- `src/lib/deepwokenUnbiasedBuildIdea.js`
  - similar to the biased one, but without the weights
  - will probably merge these two someday
- `src/lib/deepwokenEquipment.js`
  - a bunch of things relating to deepwoken equipment, like generating pips and getting a random one
- `src/lib/default_embed.js`
  - just exports a function that returns an embedBuilder with a bunch of default values thats used for most embeds
- `src/lib/files.js`
  - a lot of various operations usually relating to file reading / writing, tbh i didn't really know what to call this file
    - generate a string with a list of files in a folder (similar to running `ls` or `dir`)
    - convert a string to a file and return the file path
    - fixing file names (replacing punctuation and spaces and lowercase and stuff like that)
    - reading a section of a file
    - getting the length (in lines) of a file
- `src/lib/globals.js`
  - not really globals, just at the time of its creation it was only things used in every command and im too lazy to change the imports now
  - basically just imports a bunch of constant JSON files
- `src/lib/gpt.js`
  - contains a bunch of functions for generating and editing gpt conversations and responses
- `src/lib/guildConfigs.js`
  - contains a bunch of functions for creating, deleting, editing, and returning guild configs
  - also exports all the guild configs and handles their changes
- `src/lib/log.js`
  - contains all the log levels like debug, error, fatal, info, and warn
- `src/lib/statistics.js`
  - similar to guildConfigs, imports the statistics file and handles all changes towards it
- `src/lib/tokenizer.js`
  - ngl i have no idea wtf this does, it was used by a markov chain example i found, not sure which one it is though.
- `src/lib/voice.js`
  - contains a lot of functions for voice channels, connections, audio players and audio resources