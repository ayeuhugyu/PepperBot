import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import * as action from "../lib/discord_action";
import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import { getCurrentUpdateNumber, getUpdate, Update } from "../lib/update_manager";
import { createThemeEmbed, Theme } from "../lib/theme";
import { EmbedBuilder } from "@discordjs/builders";
import { CommandTag, SubcommandDeploymentApproach, CommandOptionType } from "../lib/classes/command_enums";


function sectionedEmbed(text: string) {
    let sections = [];
    const sectionRegex = /\*\*(.*?):\*\*/g;
    let match;
    let lastIndex = 0;
    let firstMatch = true;

    while ((match = sectionRegex.exec(text)) !== null) {
        if (firstMatch) {
            firstMatch = false;
            continue;
        }
        sections.push(text.substring(lastIndex, match.index));
        lastIndex = match.index;
    }
    sections.push(text.substring(lastIndex));

    return sections;
}

function largeTextEmbeds(sections: string[], update: Update) {
    const limitedSections: Array<string>[] = [];
    let currentLimitedSection: string[] = [];
    sections.forEach(section => {
        if (currentLimitedSection.join('').length + section.length > 5900) {
            limitedSections.push(currentLimitedSection);
            currentLimitedSection = [];
        }
        currentLimitedSection.push(section);
    });
    if (currentLimitedSection.length > 0) {
        limitedSections.push(currentLimitedSection);
    }

    let first = true;
    const messages = limitedSections.map((limitedSection, index) => {
        const embeds = [];
        for (let section of limitedSection) {
            const embed = createThemeEmbed(Theme.CURRENT);
            if (first) {
                first = false;
                embed.setTitle(`PepperBot ${update.major ? "major update" : "patch"} #${update.id}!`);
            }
            embed.setDescription(section);
            embeds.push(embed);
        }
        return {
            embeds,
        }
    });

    return messages;
}

function embedUpdate(update: Update) {
    const text = update.text;
    const major = update.major;
    const id = update.id;
    let sections = [text];

    if (text.length > 4096) {
        sections = sectionedEmbed(text);
        if (sections.some(section => section.length > 4096)) {
            for (let section of sections) {
                if (section.length > 4096) {
                    const subsections = section
                        .split('\n')
                        .reduce((acc: string[], line: string) => {
                            if (acc.length === 0 || acc[acc.length - 1].length + line.length + 1 > 4096) {
                                acc.push(line);
                            } else {
                                acc[acc.length - 1] += '\n' + line;
                            }
                            return acc;
                        }, []);
                    sections.splice(sections.indexOf(section), 1, ...subsections);
                }
            }
        }
    }
    if (sections.join('').length > 5900) {
        return largeTextEmbeds(sections, update);
    }
    const embeds = [];
    let first = true;
    for (let section of sections) {
        const embed = createThemeEmbed(Theme.CURRENT);
        if (first) {
            first = false;
            embed.setTitle(`PepperBot ${major ? "major update" : "patch"} #${id}!`);
        }
        embed.setDescription(section);
        embeds.push(embed);
    }

    return embeds;
}

const get = new Command({
        name: 'get',
        description: 'fetches a specific update',
        long_description: 'fetches a specific update by its number',
        tags: [CommandTag.Info],
        pipable_to: [CommandTag.TextPipable],
        aliases: ['content'],
        root_aliases: [],
        options: [
            new CommandOption({
                name: 'content',
                description: 'the update to fetch',
                type: CommandOptionType.Number,
                required: false,
            })
        ],
        example_usage: "p/update get 93",
        argument_order: "<content>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["content"]),
    async function execute ({ invoker, guild_config, args }) {
        const updateNumber = parseInt(args.content.toString()) || await getCurrentUpdateNumber();
        const update = await getUpdate(updateNumber);
        if (!update) {
            action.reply(invoker, {
                content: `update ${updateNumber} not found`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                error: true,
                message: `update ${updateNumber} not found`,
            });
        }
        const embeds = embedUpdate(update);
        if (Array.isArray(embeds) && embeds[0] && 'embeds' in embeds[0]) {
            action.reply(invoker, {
                content: `update #${updateNumber} (<t:${update.timestamp.getTime() * 0.001}:D>) https://canary.discord.com/channels/1112819622505365556/1171660137946157146/${update.message_id} (too large to display)`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return new CommandResponse({
                pipe_data: { input_text: update.text },
            });
        }
        action.reply(invoker, {
            content: `${update.major ? "major update" : "patch"} #${updateNumber} (<t:${update.timestamp.getTime() * 0.001}:D>) https://canary.discord.com/channels/1112819622505365556/1171660137946157146/${update.message_id}`,
            embeds: embeds as EmbedBuilder[],
            ephemeral: guild_config.other.use_ephemeral_replies,
        }); // when online update viewer is finished, link to that
        return new CommandResponse({ pipe_data: { input_text: update.text } });
    }
);

const command = new Command( // todo change descriptions
    {
        name: 'update',
        description: 'manages updates',
        long_description: 'allows you to fetch specific updates, as well as allowing developers to create updates. ',
        tags: [CommandTag.Info],
        argument_order: "<subcommand> <content?>",
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [get],
        },
        options: [],
        example_usage: "p/git",
        pipable_to: [],
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute ({ invoker, guild_config, args }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help update for a list of subcommands`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            })
            return new CommandResponse({
                error: true,
                message: `invalid subcommand: ${args.subcommand}; use ${guild_config.other.prefix}help update for a list of subcommands`,
            });
        }
        action.reply(invoker, {
            content: "this command does nothing if you don't supply a subcommand",
            ephemeral: guild_config.other.use_ephemeral_replies
        })
    }
);

export default command;