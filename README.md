# PepperBot

![PepperBot Banner](./docs/doc.png)

![Static Badge](https://img.shields.io/badge/71.2%25?style=flat&label=Uptime&labelColor=FFFF00%20)

hello! this is the repo for my discord bot, [PepperBot](https://pepperbot.online/guide)

this is a bot mostly focused on giving users full control over an AI chatbot, allowing people to change the prompts, change the temperature and top_p, change the model, etc.

there's some other commands, but they will always remain secondary to the chatbot stuff.

# How to Run

1. clone the repo with git or by downloading source code or with some other method
2. install `bun` from https://bun.sh/ if you haven't already
    - you might need to run `bun upgrade` to update it if you already had it  installed
3. run `bun setup` to install dependencies, perform database migrations, and create a .env file.
4. look inside the .env file and follow the instructions for at minimum the DISCORD_TOKEN.
5. run `bun start` to start the bot

this will get the bot running, but it will still be missing some features. the next section explains everything else needed to run with the full capabilities

### Additional Installations

these aren't required for the bot to run, but some features won't work without them

depending on your system, you might be able to install them by using `bun extras:install`, but this won't work for everyone. if it doesn't work, use the manual installations below.

- for the queue and playurl commands:
    - install `yt-dlp` from https://github.com/yt-dlp/yt-dlp/releases/latest
    - add it to your PATH, however that is done on your device.
- for the evaluate_luau GPT tool:
    - install `lune` from https://github.com/lune-org/lune/releases/latest
    - add it to your PATH, however that is done on your device.