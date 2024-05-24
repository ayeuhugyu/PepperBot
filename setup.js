import fsextra from "fs-extra";
import fs from "fs";

const folders = [
    "resources",
    "resources/sounds",
    "resources/containers",
    "resources/data/guildConfigs",
    "resources/data/queues",
    "resources/gptdownloads",
    "resources/ytdl_cache",
]
const files = {
    "resources/data/blacklist.json": "[]",
    "resources/data/persistent_data.json": `{
        "version": "0"
    }`,
    "resources/data/statistics.json": `{}`,
    "resources/data/reaction_roles.json": `{}`,
    ".env": `DISCORD_TOKEN = "UNDEFINED, GET IT FROM DISCORD DEVELOPER PORTAL"
    WEBHOOK_TOKEN = "UNDEFINED, GET IT FROM DISCORD DEVELOPER PORTAL"
    OPENAI_API_KEY = "UNDEFINED, GET IT FROM OPENAI"
    YOUTUBE_API_KEY = "UNDEFINED, GET IT FROM GOOGLE DEVELOPER CONSOLE"
    ADOBE_API_KEY = "UNDEFINED, GET IT FROM ADOBE"`,
    "logs/messages.log": ""
}

function setup() {
    for (const folder of folders) {
        fsextra.ensureDirSync(folder);
    }
    for (const file in files) {
        if (!fs.existsSync(file)) {
            fsextra.ensureFileSync(file);
            fs.writeFileSync(file, files[file]);
        }
    }
}

setup()