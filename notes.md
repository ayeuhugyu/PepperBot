LATEST UPDATE
---
it has finally been done! the rewrite is complete!

lets start off with the bad stuff so you'll forget about it by the time you finish reading
**removals:**
- p/cleanup
- p/notice
- p/trueban  (as well as systems related to it)
- p/blacklist
- p/pepperannouncement
- p/setversion
- p/update's subsidiaries (not the command itself, they have been replaced with a whole new update system thingy)
  - p/subupdate
  - p/patch
- p/corrupt (it was so ass)
- p/jak (soloed by booru.soy)
- p/embed
- p/markov
- p/random buildidea
- p/equipment (both of these are just too hard to maintain, deepwoken updates too often for me to give a shit (especially since i dont even play the game anymore))
- p/force (two reasons: it's TOS questionable and i lowkey just didn't wanna bother remaking it; i might readd it later if theres enough demand for it)
- p/playurl
- p/queue (again, two reasons: music commands which use ytdlp and shit are TOS questionable, and it just doesn't feel very *pepperbot-ey.* i'm trying to make this bot more unique, which involves getting rid of stuff like this that is just either done better by other bots or is super ultra common)

$SPLIT_EMBED$

the biggest new base feature
**command piping:**

- commands can now be piped by adding " | p/command" to the end of it. for example: "p/test | p/test | p/test"
- new command p/grep which functions nearly identically to grep on linux, added exclusively for the purpose of piping to it
  there's too many commands that are pipable to eachother to really list, so just find out yourself by looking at the guide page.
- also new p/tail and p/head which function again the same as head and tail on linux.

$SPLIT$

**new commands:**
-# excluding previously mentioned commands and commands which have been entirely redone

- new p/random phrase allows you to generate phrases based off parts of speech (ex. p/random phrase noun adjective adverb verb noun)
- new p/encode and p/decode allow you to encode and decode text via various algorithms. use `p/encode list` to get a list of all of the algorithms.
- brought back p/sendlog because of the new piping related commands
- new p/schedule allows you to schedule reminders and make pepperbot ping/dm you at a certain time to remind you of something. even if the bot goes offline temporarily, any events missed over the downtime will be caught up with.
- new p/alias allows you to make up your own aliases for commands. the content is literally just replaced directly, so you can even provide arguments or alias piping to other commands.

$SPLIT_EMBED$

**gpt stuff:**

- tool calls have been improved, instead of using my own system i am yet again using another openai feature. i've found one that allows for tools but without the usage of the stupid assistants api, resulting in only a little bit slower response times, compared to the much slower times the last time i tried this. this has several benefits:
  - tool calls can no longer be messed up, so never again will you see $EXEC_TOOL stuff
  - custom prompts can now use tool calls
  - tool calls will take less time to process because the AI doesn't need to spend time writing $EXEC_TOOL or the text he likes to write around it
- new tools:
  - new "date_to_timestamp" tool allows dates to be converted to timestamps
  - new "request_raw_url" allows gpt to request urls with specified body, headers, and method values. this could in theory allow it to use public APIs
  - new "pick_random" tool allows gpt to get a random item from a list
  - probably the most powerful tool ever added, "evaluate_luau" allows gpt to write and evaluate custom luau code. this can be used to complete semi-complex tasks almost instantly
- removed tools:
  - get_listening_data because he was overusing it
  - describe_image because he wasn't using it correctly
  - dm because it was stupid
  - date because it has been replaced with date_to_timestamp
  - get_update because it was stupid
  - get_deepwoken_build because i dont really deepwoken much more
- you can now choose which tools are enabled in your prompt/conversation
- p/prompt has been completely overhauled
  - prompts are now automatically saved instead of you having to do p/prompt save
  - prompts can now be published for viewing on the prompt browser
  - prompts now save when they were last updated & created & published
  - prompts now have a description property (to be used by the prompt browser)
  - prompts now have an nsfw property (to be used by the prompt browser)
  - you can now set the default prompt to a custom one
  - saved prompts can now be deleted
- use `p/prompt edit` to try out all this new stuff
- gpt now has a completely new prompt
  - if you for some reason want to use the old prompt, you still can by running `d/prompt use PepperBot/old`.
- gpt conversations are now MUCH more customizable via the use of `p/conversation configure`
- gpt responses now use openai's seeding feature so they can be reproduced
- AI can now see stickers
- default model is now gpt-4.1-nano instead of gpt-4o-mini. it's significantly cheaper and better at following instructions (which unfortunately means its also better at following openai's dumb internal instructions)
- GPT models have been completely overhauled, which means that in the future there is now support for models from manufacturers other than openai, including grok and llama models. here's an updated list of available models:
  - gpt-3.5-turbo (the oldest model i've ever used on pepperbot)
  - gpt-4o-mini (slightly more up to date openai model)
  - o3-mini (openai's cheapest reasoning model, still fairly good actually)
  - gpt-4.1-nano (the new default, is ABSURDLY fast)
  - grok-3-mini-beta (something from a provider other than openai)
  - deepseek-r1 (reasoning model, uses llama. note that it takes context very weirdly)
  - closex/neuraldaredevil-8b-abliterated (weird model i found, somewhat good at being casual)
- you can run `p/conversation configure` and configure the model and start clicking around on them to get a better idea of what each of them does.

$SPLIT_EMBED$

**other actual content:**

- command data has been overhauled
  - whitelists are now comprised of users, roles, channels, and guilds rather than just users
  - blacklists now exist (exact opposite of whitelists)
  - improved help/tutorial values:
    - commands now have tags
    - descriptions are separated into a short and long form, one for display under a slash command and one for all other cases
    - requirements can now have longer forms (ex. required if arg2 is undefined)
    - contributors can be added (basically just to credit people)
    - commands now have usage examples
    - commands now have argument orders
- site has been completely remade
- bots can no longer execute any commands. this was just yet another value i had to think about if it would cause problems or not
- p/vc join & leave now check for the "speak" permission instead of the "connect" permission
- p/sound list & p/prompt list now use a 3 column list instead of a text file
- p/help has been greatly improved
- p/gpt has been renamed to p/conversation
- i've made a new update system that allows me to easily create these sorts of embeds with just text and nothing else