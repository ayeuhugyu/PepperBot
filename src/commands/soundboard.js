import * as action from "../lib/discord_action.js";
import { Collection } from "discord.js";
import fs from "fs";
import * as voice from "../lib/voice.js";
import * as textfiles from "../lib/files.js";
import * as log from "../lib/log.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

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
data.setName("soundboard");
data.setDescription("plays the specified sounds");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases(["playsound", "play"]);
data.addStringOption((option) =>
    option
        .setName("sound")
        .setDescription(
            "what to play\nput `ls` to list sounds or `stop` to stop playing"
        )
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
            // special cases
            if (args.get("sound") == "ls") {
                let sounds = await textfiles.generateLSText(
                    config.paths.soundboard
                );
                let soundLsFile = await textfiles.textToFile(sounds, "sounds");
                action.reply(message, { files: [soundLsFile] });
                return;
            }
            let connection = await voice.getVoiceConnection(message.guild.id);
            if (!connection) {
                // join vc by default
                connection = await voice.joinVoiceChannel(
                    message.member.voice.channel
                );
                action.reply(message, {
                    content: `joined <#${message.member.voice.channel.id}>`,
                    ephemeral: true,
                });
            }
            if (!connection) {
                // if they aren't in a vc
                action.reply(message, {
                    content:
                        "you're not in a voice channel, and im not already in one. baffoon.",
                    ephemeral: true,
                });
                return;
            }
            const audioPlayer = await voice.createAudioPlayer(message.guild.id);
            connection.subscribe(audioPlayer);
            if (args.get("sound") == "stop") {
                // do all of the special cases after checking that there even can be an audio player
                voice.stopAudioPlayer(audioPlayer);
                action.reply(message, "stopped");
                return;
            }
            const sounds = await fs.readdirSync(config.paths.soundboard);
            const sound = await autocorrect(args.get("sound"));
            for (const value of Object.values(sound)) {
                if (sounds.includes(value)) {
                    const resource = await voice.createAudioResource(
                        `${config.paths.soundboard}/${value}`
                    );
                    voice.playResource(resource, audioPlayer);
                    action.reply(message, {
                        content: `playing \`${value}\``,
                        ephemeral: true,
                    });

                    return;
                }
            }
        } else {
            action.reply(message, {
                content: "provide a sound to play you baffoon!",
                ephemeral: true,
            });
        }
    }
);

export default command;
