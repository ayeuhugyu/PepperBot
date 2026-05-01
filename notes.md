info:
$SPLIT$ - add horizontal line
$SPLIT_EMBED$ - new container

TODO
---
- finish OverrideParameters type
- start/finish new Prompt type
- start/finish Conversation type
- create model runners
- database schemas
- message types

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
prompts can no longer be marked as nsfw, i don't wish to encourage their creation and having it as an option kindof did that.
you can now have default prompts which are not your own

## tool changes
request_url has been greatly improved:
- no longer uses just plain fetch(), instead uses an actual browser. means that the resulting content will be much closer to what actual people see.
- removes more uselss data (svgs & some others)
- added something which should hopefully help mitigate anti-bot challenges

## other stuff
updated discord.js and @discordjs/voice
fixed index page redirects wrapping and looking really ugly on certain browsers