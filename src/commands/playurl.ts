import { Collection, GuildMember, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import * as voice from "../lib/voice";
import { isSupportedUrl, ToFileResponseType, Video } from "../lib/classes/queue_manager";
import { Readable } from "stream";

const command = new Command(
    {
        name: 'playurl',
        description: 'play a url over voice',
        long_description: 'play a url over voice; this supports most audio related urls. internally, it uses yt-dlp, so anything that supports will be supported here. ',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/playurl https://www.youtube.com/watch?v=Te_cA3UeFQg",
        argument_order: "<url>",
        aliases: ["play", "playvideo"],
        options: [
            new CommandOption({
                name: 'url',
                description: 'the url of the video to play',
                type: CommandOptionType.String,
                required: true,
            })
        ]
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["url"]),
    async function execute ({ args, invoker, guild_config, invoker_type }) {

        if (!args || !args.url) {
            action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
            return;
        }

        let connectionManager = await voice.getVoiceManager(invoker.guildId || "");
        if (!connectionManager && (invoker.member instanceof GuildMember) && invoker.member?.voice.channel) {
            connectionManager = await voice.joinVoiceChannel((invoker.member.voice.channel));
        }
        if (!connectionManager) {
            action.reply(invoker, {
                content: `neither of us are in a voice channel, use ${guild_config.other.prefix}vc join to make me join one`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }

        let url = args.url;
        if (url.startsWith("<") && url.endsWith(">")) {
            url = url.slice(1, -1);
        }
        url = url.replaceAll("\"", ""); // this prevents shell injection

        const sent = await action.reply(invoker, {
            content: `checking url support...`
        });

        const supportedResponse = await isSupportedUrl(url);
        if (!supportedResponse.supported) {
            action.edit(sent, {
                content: `unsupported url: \`${supportedResponse.stderr}\``,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        const video = new Video(url);

        await action.edit(sent, {
            content: "fetching video info..."
        });

        let caughtInfoError = false;

        const infoResponse = await video.getInfo().catch(err => {
            action.edit(sent, {
                content: `failed to get video info: \`${err}\``,
            });
            caughtInfoError = true;
        });
        if (caughtInfoError) {
            return;
        }
        if (typeof infoResponse === "string") {
            action.edit(sent, {
                content: `failed to get video info: ${infoResponse}`,
            })
            return;
        }

        await action.edit(sent, {
            content: `downloading \`${video.title}\`...`
        });

        let caughtBufferError = false;

        const fileResponse = await video.toFile().catch(err => {
            action.edit(sent, {
                content: `failed to download file: \`${err.data}\``,
            });
            caughtBufferError = true;
        });
        if (caughtBufferError) {
            return;
        }
        if (fileResponse?.type === ToFileResponseType.Error) {
            action.edit(sent, {
                content: `failed to download file: ${fileResponse.data}`,
            })
            return;
        }
        if (fileResponse?.type !== ToFileResponseType.Success) {
            action.edit(sent, {
                content: `failed to download file: unknown error`,
            });
            return
        }
        const resource = await voice.createAudioResource(fileResponse?.data);
        if (!resource) {
            action.edit(sent, {
                content: `failed to create audio resource`,
            })
            return;
        }
        connectionManager.audio_player.play(resource);
        await action.edit(sent, {
            content: `playing \`${video.title}\`...`
        });
    }
);

export default command;