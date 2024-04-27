import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection } from "discord.js";
import fs from "fs";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;

function autocorrect(message) {
    message.toLowerCase();
    let corrections = {
        regular: message,
        spaced: message.replaceAll(" ", "_"),
        spacedmp3: message.replaceAll(" ", "_") + ".mp3",
        mp3: message + ".mp3",
        spacedogg: message.replaceAll(" ", "_") + ".ogg",
        ogg: message + ".ogg",
        spacedwav: message.replaceAll(" ", "_") + ".wav",
        wav: message + ".wav",
        spacedwebm: message.replaceAll(" ", "_") + ".webm",
        webm: message + ".webm",
        spacedm4a: message.replaceAll(" ", "_") + ".m4a",
        m4a: message + ".m4a",
        spacedmp4: message.replaceAll(" ", "_") + ".mp4",
        mp4: message + ".mp4",
        spacedflac: message.replaceAll(" ", "_") + ".flac",
        flac: message + ".flac",
    };
    return corrections;
}

const data = new CommandData();
data.setName("retrievesound");
data.setDescription("returns a sound");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["getsound"]);
data.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription("what sound to return")
        .setRequired(true)
);
const command = new Command(
    data,
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        args.set(
            "sound",
            message.content
                .slice(config.generic.prefix.length + commandLength)
                .trim()
        );
        return args;
    },
    async function execute(message, args) {
        if (args.get("sound")) {
            const sounds = await fs.readdirSync(config.paths.soundboard);
            const sound = await autocorrect(args.get("sound"));
            let file;
            for (const value of Object.values(sound)) {
                if (sounds.includes(value)) {
                    file = value;
                }
            }
            if (file) {
                let msg = await action.reply(
                    message,
                    "uploading your sound, please wait"
                );
                action.editMessage(msg, {
                    content: "here ya go",
                    files: [`${config.paths.soundboard}/${file}`],
                    ephemeral: true,
                });
            } else {
                action.reply(message, {
                    content: `there's no such thing as \`${args.get(
                        "sound"
                    )}\``,
                });
            }
        } else {
            action.reply(message, {
                content: "provide a sound to return you baffoon!",
                ephemeral: true,
            });
        }
    }
);

export default command;
