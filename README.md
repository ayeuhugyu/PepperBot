# PepperBot

hello! this is the repo for my discord bot, [PepperBot](https://pepperbot.online/guide)\
this is a bot mostly focused on giving users full control over an AI chatbot, allowing people to change the prompts, change the temperature and top_p, change the model, etc.\
there's some other commands, but they will always remain secondary to the chatbot stuff.

# How to Run

1. clone the repo with git or by downloading source code or with some other method
2. install `bun` from https://bun.sh/ if you haven't already
    - you might need to run `bun upgrade` to update it if you already had it  installed
3. run `bun install` from within the project directory to install dependencies
4. gather .env variables:
    - create a file in the root of the repo named `.env`
    - write the following into it: (you can omit comments, they just explain what each is used for)
    ```ini
    DISCORD_TOKEN = "" # required to run the bot
    DISCORD_CLIENT_SECRET = "" # required for oauth2 stuff on the website
    OPENAI_API_KEY = "" # required for GPT responses
    GOOGLE_API_KEY = "" # required for the search GPT tool
    GOOGLE_CUSTOM_SEARCH_ENGINE_ID = "" # required for the search tool given to GPT to work
    ADOBE_API_KEY = "" # required for the cquery command
    LASTFM_API_KEY = "" # required for the get_listening_data GPT tool
    PATH_TO_COOKIES = "" # not required but use if yt-dlp throws errors for "missing cookies"
    IS_DEV = "True" # not required, but makes the website and other stuff locally hosted
    ```
    - this is just a template for all the api keys and values any of the scripts are looking for
    - the only one ABSOLUTELY REQUIRED for the bot to run is `DISCORD_TOKEN`, which is your discord bot token obtainable from https://discord.com/developers/applications
    - i'll leave it up to you to figure out how to get the api keys, most if not all of them are pretty self explanatory but if you truly can't figure it out make an issue and i'll consider expanding this
5. run `bun start` to start the bot
    - this might error the first time, so if it exits prematurely then just run it again
    - this is caused by the script being unable to create the files necessary before it can get to a point that it needs them, but once it has created them it should work fine.

this will get the bot running, but it will still be missing some features. the next section explains everything else needed to run with the full capabilities

### Additional Installations

these aren't required for the bot to run, but some features won't work without them

- for the queue and playurl commands:
    - install `yt-dlp` from https://github.com/yt-dlp/yt-dlp/releases/latest
    - add it to your PATH, however that is done on your device.
- for the evaluate_luau GPT tool:
    - install `lune` from https://github.com/lune-org/lune/releases/latest
    - add it to your PATH, however that is done on your device.