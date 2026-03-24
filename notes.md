info:
$SPLIT$ - add horizontal line
$SPLIT_EMBED$ - new container

LATEST UPDATE
---
# so i did it again...
i rewrote the whole entire gpt script again because i didn't like it
$SPLIT$
## a lotta prompt changes

added some new models:
- `gpt-5-mini`: openai's latest reasoning model, wayyyy faster than previous iterations
- `mistral-small-2`: i'm testing out mistral models here, in my experience they seem to be better with casual conversations. this might end up being useless, but we'll have to see.
model parameters and tool call parameters now use zod schemas to define their types instead of weird json data. basically they'll have better type checking n stuff now

## other stuff
updated discord.js and @discordjs/voice