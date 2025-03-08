import { Collection, GuildMember, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import * as voice from "../lib/voice";
import { isSupportedUrl, Response, ResponseType, Video, VideoError } from "../lib/classes/queue_manager";
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
        url = url.replaceAll("\"", "");

        const sent = await action.reply(invoker, {
            content: `checking url support...`
        });

        const supportedResponse = await isSupportedUrl(url).catch((err: Response<true, VideoError>) => { return err });
        if (supportedResponse?.type === ResponseType.Error) {
            action.edit(sent, {
                content: `unsupported url: \`${supportedResponse.data.message}\`\n-# \`${supportedResponse.data.full_error}\``,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        const video = new Video(url);

        await action.edit(sent, {
            content: "fetching video info..."
        });

        const infoResponse = await video.getInfo().catch((err: Response<true, VideoError>) => { return err });
        if (infoResponse?.type === ResponseType.Error) {
            action.edit(sent, {
                content: `failed to get video info: \`${infoResponse.data.message}\`\n-# \`${infoResponse.data.full_error}\``,
            })
            return;
        }

        await action.edit(sent, {
            content: `downloading \`${video.title}\`...`
        });

        const fileResponse = await video.toFile().catch((err: Response<true, VideoError>) => { return err });
        if (fileResponse?.type === ResponseType.Error) {
            action.edit(sent, {
                content: `failed to download file: \`${fileResponse.data.message}\`\n-# \`${fileResponse.data.full_error}\``,
            })
            return;
        }
        const resource = await voice.createAudioResource(fileResponse?.data);
        if (!resource) {
            action.edit(sent, {
                content: `failed to create audio resource\n-# \`resource was undefined\``,
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