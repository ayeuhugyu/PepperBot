info:
$SPLIT$ - add horizontal line
$SPLIT_EMBED$ - new container

TODO
---
- finish p/prompt edit
- finish p/conversation manipulate

LATEST UPDATE
---
# so i did it again...
i rewrote the whole entire gpt script again because i didn't like it
$SPLIT$
## a lotta prompt changes

- added some new models:
  - `gpt-5-mini`: openai's latest reasoning model, wayyyy faster than previous iterations
  - `mistral-small-2`: i'm testing out mistral models here, in my experience they seem to be better with casual conversations. this might end up being useless, but we'll have to see.
- removed some models:
  - `deepseek-r1`: it lowkey fucking sucks at following prompts and i hate it
  - `closex/neuraldaredevil-8b-abliterated`: really just not very good in general
-# mostly removed these because supporting ollama models is kindof annoying, and i'd like to eventually remake it with llama.cpp instead of ollama. nobody was using these models anyways.
- model parameters and tool call parameters now use zod schemas to define their types instead of weird json data. basically they'll have better type checking n stuff now
- prompts can no longer be marked as nsfw, i don't wish to encourage their creation and having it as an option kindof did that.
- you can now have default prompts which are not your own
- added prompt parameters:
  - `IOReplacements`: allows you to toggle on and off the input/output replacements. if you don't know what these are, tldr messages get edited when sent to the AI so that @'s (ex. `<@12345678912345678901>`) get transformed into something more useful than just the ID. (ex. `<@ayeuhugyu>`). this happens to users, channels, roles, etc.
  - `enableTemplating`: whether or not to enable prompt templating. this is a new system that will replace some of the prompt's content with generated content, sometimes static sometimes dynamic. some of it is just like a shorthand, ex. `${slangTable}` is static and just outputs my slang table. others are dynamic, ex. `${guildemojis}` which outputs a list of all guild-based emojis available.
  - `processingType`: allows you to swap between various "processing..." types. there's the `default`, where it just sends a message containing "processing..." and edits it with updates and stuff. there's `typing`, where it just starts typing in the channel, and finally there's `none`, which makes it do nothing as expected.

## tool changes
- request_url has been greatly improved:
  - no longer uses just plain fetch(), instead uses an actual browser. means that the resulting content will be much closer to what actual people see.
  - removes more uselss data (svgs & some others)
  - added something which should hopefully help mitigate anti-bot challenges

## other stuff
- updated discord.js and @discordjs/voice
- fixed index page redirects wrapping and looking really ugly on certain browsers