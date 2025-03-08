import { Collection, GuildMember, Message } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { GPTFormattedCommandInteraction, GPTProcessor, respond } from "../lib/gpt";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import * as voice from "../lib/voice";
import { getInfo, Response, ResponseType, Video, VideoError } from "../lib/classes/queue_manager";
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
            if (invoker_type === InvokerType.Message) {
                if ((invoker as Message).attachments.size > 0) {
                    const attachment = (invoker as Message).attachments.first();
                    if (!attachment) {
                        action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                        return;
                    }
                    args.url = attachment.url;
                }
            } else {
                action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                return;
            }
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
            content: `getting video info...`
        });
        const item = await getInfo(url, true).catch((err: Response<true, VideoError>) => { return err });
        if (item?.type === ResponseType.Error) {
            action.edit(sent, {
                content: `failed to get video info: \`${item.data.message}\`\n-# \`${item.data.full_error}\``,
            })
            return;
        }
        const video = item.data as Video;

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