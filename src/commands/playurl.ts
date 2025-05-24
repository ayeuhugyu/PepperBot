import { Collection, GuildMember, Message, MessageFlags } from "discord.js";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import { CommandTag, CommandOptionType, InvokerType } from "../lib/classes/command_enums";
import * as voice from "../lib/classes/voice";
import { Playlist, Video } from "../lib/music/media";
import { fetchMediaInfo, downloadMedia } from "../lib/downloaders"; // <-- new downloader imports
import { createAudioResource } from "@discordjs/voice";
import * as log from "../lib/log";
import { embedVideoOrSound } from "../lib/music/embed";
import { Container, TextDisplay } from "../lib/classes/components";

const command = new Command(
    {
        name: 'playurl',
        description: 'play a url over voice',
        long_description: 'play a url over voice; this supports most audio related urls. if provided a playlist or album, the first item will be the one that gets played.',
        tags: [CommandTag.Voice, CommandTag.Music],
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
        let currentContent = `-# routing...`;
        const sent = await action.reply(invoker, {
            components: [
                new TextDisplay({
                    content: currentContent,
                })
            ],
            components_v2: true,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
        if (!sent) return;

        // Fetch info using new downloader system
        let lastLog = "";
        const logFunc = (msg: string) => {
            if (msg && msg !== lastLog && msg.replaceAll("\n", " ").trim().length > 0) {
                lastLog = msg;
                currentContent += `\n-# ${msg.replaceAll("\n", " ").trim()}`;
                action.edit(sent, {
                    components: [
                        new TextDisplay({
                            content: currentContent,
                        })
                    ],
                    components_v2: true,
                    ephemeral: guild_config.other.use_ephemeral_replies,
                });
            }
        };

        const editLatest = (msg: string) => {
            if (msg && msg !== lastLog && msg.replaceAll("\n", " ").trim().length > 0) {
            lastLog = msg;
            // Replace the last line (after the last '\n-# ') with the new message
            const lines = currentContent.split('\n');
            let lastIdx = lines.length - 1;
            // Find the last line that starts with '-# '
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].startsWith('-# ')) {
                lastIdx = i;
                break;
                }
            }
            lines[lastIdx] = `-# ${msg.replaceAll("\n", " ").trim()}`;
            currentContent = lines.join('\n');
            action.edit(sent, {
                components: [
                new TextDisplay({
                    content: currentContent,
                })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            }
        }

        let media = await fetchMediaInfo(args.url, logFunc, editLatest);
        if (!media) {
            currentContent += `\nfailed to get media info; no result returned`;
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: currentContent,
                    })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: currentContent,
            });
        }
        // If playlist, use the first item
        if (media instanceof Playlist && Array.isArray((media as Playlist).videos) && (media as Playlist).videos.length > 0) {
            media = (media as Playlist).videos[0];
        }
        if (!(media instanceof Video)) {
            currentContent += `\nfailed to get a playable video from that URL`;
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: currentContent,
                    })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: currentContent,
            });
        }

        // Download the video using new downloader system
        let video = await downloadMedia(media, logFunc, editLatest);
        log.debug(`downloaded video`, video);
        if (!video || !video.filePath) {
            currentContent += `\nfailed to get video file; download failed or no path returned`;
            await action.edit(sent, {
                components: [
                    new TextDisplay({
                        content: currentContent,
                    })
                ],
                components_v2: true,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: currentContent,
            });
        }

        const resource = createAudioResource(video.filePath);
        voiceManager.play(resource);

        currentContent = `playing \`${video.title}\``;
        await action.edit(sent, {
            components: [
                new TextDisplay({
                    content: currentContent,
                }),
                new Container({
                    components: [embedVideoOrSound(media, true)]
                })
            ],
            components_v2: true,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default command;