import { Collection, GuildMember, Message, MessageFlags } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import * as voice from "../lib/classes/voice";
import { DownloaderEvents, DownloaderPromise } from "../lib/downloaders/types";
import { Playlist, Video } from "../lib/classes/queue";
import { getInfo, download } from "../lib/downloaders/router";
import { createAudioResource } from "@discordjs/voice";
import * as log from "../lib/log";

const command = new Command(
    {
        name: 'playurl',
        description: 'play a url over voice',
        long_description: 'play a url over voice; this supports most audio related urls. internally, it uses yt-dlp, so anything that supports will be supported here. ',
        tags: [CommandTag.Voice],
        pipable_to: [],
        example_usage: "p/playurl https://www.youtube.com/watch?v=tbBwELgDPD8",
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
        if (!invoker.guild) {
            action.reply(invoker, { content: "this command can only be used in a guild", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: "this command can only be used in a guild",
            });
        }

        if (!args || !args.url) {
            if (invoker_type === InvokerType.Message) {
                if ((invoker as Message).attachments.size > 0) {
                    const attachment = (invoker as Message).attachments.first();
                    if (!attachment) {
                        action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                        return new CommandResponse({
                            error: true,
                            message: "please provide a url",
                        });
                    }
                    args.url = attachment.url;
                }
            } else {
                action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "please provide a url",
                });
            }
            if (!args.url) {
                // if we still don't have a url after checking attachments
                action.reply(invoker, { content: "please provide a url", ephemeral: guild_config.other.use_ephemeral_replies });
                return new CommandResponse({
                    error: true,
                    message: "please provide a url",
                });
            }
        }


        const voiceManager = voice.getVoiceManager(invoker.guild);
        if (!voiceManager.connected) {
            if (invoker.member && invoker.member instanceof GuildMember) {
                if (invoker.member.voice.channel) {
                    voiceManager.connect(invoker.member.voice.channel);
                }
            }
        }
        if (!voiceManager.connected) {
            action.reply(invoker, { content: `neither of us are in a voice channel; use \`${guild_config.other.prefix}vc join\` to make me join one OR join one and run this command again to be automatically joined`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({
                error: true,
                message: `neither of us are in a voice channel; use \`${guild_config.other.prefix}vc join\` to make me join one OR join one and run this command again to be automatically joined`,
            });
        }
        let currentContent = `routing...`;
        const sent = await action.reply(invoker, {
            content: currentContent,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
        if (!sent) return; // this should realistically never happen
        currentContent = ``;

        // download the video
        const emitter = new DownloaderPromise();
        let errored = false;
        emitter.on(DownloaderEvents.Log, (message: string) => {
            if (message) {
                currentContent += `\n${message}`;
                action.edit(sent, {
                    content: currentContent,
                    ephemeral: guild_config.other.use_ephemeral_replies,
                });
            }
        });
        emitter.on(DownloaderEvents.Reject, (message: string) => {
            currentContent += `\n${message}`
            errored = true;
            action.edit(sent, {
                content: currentContent,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
        });
        let video: Video | undefined;
        emitter.on(DownloaderEvents.Resolve, (data: Video) => {
            video = data;
        })
        await getInfo(args.url, emitter);
        if (video instanceof Playlist && video.items) {
            video = video.items[0];
        }
        log.debug(`got video info`, video);
        if (errored) return;
        if (!video) {
            currentContent += `\nfailed to get video info; no video returned`;
            action.edit(sent, {
                content: currentContent,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: currentContent,
            });
        }
        await download(video, emitter);
        log.debug(`downloaded video`, video);
        if (errored) return;

        const path = video.file;
        if (!path) {
            currentContent += `\nfailed to get video path; no path returned`;
            action.edit(sent, {
                content: currentContent,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: currentContent,
            });
        }
        const resource = createAudioResource(path);

        voiceManager.play(resource);
        currentContent = `playing \`${video.title}\``;
        action.edit(sent, {
            content: currentContent,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });

        emitter.removeAllListeners();
    }
);

export default command;