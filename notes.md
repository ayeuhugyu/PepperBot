info:
$SPLIT$ - add horizontal line
$SPLIT_EMBED$ - new container

TODO
---
- finish p/prompt edit

LATEST UPDATE
---
# so i did it again
i rewrote the whole entire gpt script again because i didn't like it
$SPLIT$
## a lotta general prompt changes

- added some new models:
  - `gpt-5-mini`: openai's latest reasoning model, wayyyy faster than previous iterations
  - `mistral-small-2`: i'm testing out mistral models here, in my experience they seem to be better with casual conversations. this might end up being useless, but we'll have to see.
- removed some models:
  - `deepseek-r1`: it lowkey fucking sucks at following prompts and i hate it
  - `closex/neuraldaredevil-8b-abliterated`: really just not very good in general
-# mostly removed these because supporting ollama models is kindof annoying, and i'd like to eventually remake it with llama.cpp instead of ollama. nobody was using these models anyways.
- model parameters and tool call parameters now use zod schemas to define their types instead of weird json data. basically they'll have better type checking n stuff now
- prompts can no longer be marked as nsfw, i don't wish to encourage their creation and having it as an option kindof did that.
- added prompt parameters:
  - `IOReplacements`: allows you to toggle on and off the input/output replacements. if you don't know what these are, tldr messages get edited when sent to the AI so that @'s (ex. `<@12345678912345678901>`) get transformed into something more useful than just the ID. (ex. `<@ayeuhugyu>`). this happens to users, channels, roles, etc.
  - `processingType`: allows you to swap between various "processing..." types. there's the `default`, where it just sends a message containing "processing..." and edits it with updates and stuff. there's `typing`, where it just starts typing in the channel, and finally there's `none`, which makes it do nothing as expected.
  - `enableTemplating`: whether or not to enable prompt templating. this is a new system that will replace some of the prompt's content with generated content, sometimes static sometimes dynamic. some of it is just like a shorthand, ex. `${slangtable}` is static and just outputs my slang table. others are dynamic, ex. `${guildemojis}` which outputs a list of all guild-based emojis available.
-# if you have suggestions for more dynamic prompt stuff like this lmk
$SPLIT_EMBED$
## a basically brand new p/prompt command
the p/prompt command has been almost completely redone from the ground up
-# this is the main reason why i even did this in the first place, the last iteration was a ~1000 line horrendous nigh-unreadable mess of a file which was basically impossible to build anything into.
-# the new version is much, much MUCH cleaner and better organized.

- `p/prompt edit`: this wholeeee editing interface has been completely remade, and is much easier to use and less cluttered now. typing one singular p/prompt edit is much less likely to Cover Your Entire Screen now. instead of throwing literally every interface at you at once, its now separated into a bunch of different individual pages.
- `p/prompt set`: now supports attachments in a non shitty way
-# it might have done this before but i lowkey have no clue
- `p/prompt create`: creates a prompt. by default, the created prompt will be given no content, but if you add `--default` it will use the content of the current official default prompt. that makes it really easy to
- `p/prompt delete`: deletes a prompt. this time without causing loads of data inconsistencies!
-# by that i mean now it actually goes through and removes anything that was using it
- `p/prompt get`: returns the raw data of a prompt, useful for extremely long prompts that can't fit inside of a discord message
- `p/prompt list`: same as before, but now if you have a lot of prompts it splits it into columns
- `p/prompt use`: no changes
- `p/prompt generate`: no changes

- moderately related side note: `p/conversation configure` now uses the same configurator thing as `p/prompt edit` does
-# idk if it did this before but i dont think it did!
-# either way its Different now
$SPLIT_EMBED$
## tool changes
- request_url has been greatly improved:
  - no longer uses just plain fetch(), instead uses an actual browser. means that the resulting content will be much closer to what actual people see.
  - removes more uselss data (svgs & some others)
  - has an ad blocker now (crazy)
  - added something which should hopefully help mitigate requests being made useless due to stuff like tracking redirects and such
  - when using the default processing... message, request_url will no longer intermittently embed the pages while its still fetching.
-# all of this stuff is a MAYBE. obviously every website is different and i am not able to account for every single website in existence. it should be a lot better though
only downside is some stuff might take a bit longer to load, please lmk if its obnoxious as i haven't reallyyy used it all that much
$SPLIT$
- custom tools now work & can be created (hooray finally)
## other stuff
- conversations are now stored in the database, meaning they are persistent **FOREVER.** you will be able to respond to literally any message from any time and it will still have the context for it.
- extremely minor default prompt adjustments to get rid of no longer existing things / add guild emojis to it
- updated discord.js and @discordjs/voice
- fixed `p/schedule` throwing an error if you cancelled the modal and then didn't touch it again
