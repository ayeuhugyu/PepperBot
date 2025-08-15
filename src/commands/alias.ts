import { Command, CommandOption, CommandResponse } from "../lib/classes/command";
import { CommandTag, InvokerType, CommandOptionType, SubcommandDeploymentApproach } from "../lib/classes/command_enums";
import { ActionRow, Button, ButtonStyle, TextDisplay, Section, Container, Separator } from "../lib/classes/components";
import { getAlias, listAliases, Alias } from "../lib/alias_manager";
import { getArgumentsTemplate, GetArgumentsTemplateType } from "../lib/templates";
import * as action from "../lib/discord_action"

const create = new Command(
    {
        name: "create",
        description: "create a new alias",
        long_description: "create a new alias for a command or value. \naliases are incredibly powerful, as the content in the message is directly replaced, so you can alias several commands being piped together, or a command with arguments, or just a simple command name.",
        tags: [CommandTag.Utility],
        pipable_to: [],
        options: [
            new CommandOption({
                name: "alias",
                description: "the alias name",
                type: CommandOptionType.String,
                required: true,
            }),
            new CommandOption({
                name: "value",
                description: "the value for the alias",
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: [
            "p/alias create greet echo Hello, world!",
            'p/alias create "latestgitlog" "git log | head"',
            'p/alias create latestlog="d/sendlog global | tail"',
            'p/alias create "enable reasoning" gpt edit {"model":"o3-mini"}',
        ],
        argument_order: "<alias> <value>",
        aliases: ["add", "new", "createalias"],
    },
    function getArguments({ invoker, args, guild_config, command_name_used }) {
        // Remove the command prefix and subcommand
        const commandLength = `${guild_config.other.prefix}${command_name_used}`.length;
        let content = invoker.content.slice(commandLength).trim();
        // Try aliasname="alias data"
        let match = content.match(/^([^"]+?)\s*=\s*"([^"]+)"\s*$/);
        if (match) {
            return { alias: match[1].trim(), value: match[2].trim() };
        }
        // Try "alias name"="alias data"
        match = content.match(/^"([^"]+)"\s*=\s*"([^"]+)"\s*$/);
        if (match) {
            return { alias: match[1].trim(), value: match[2].trim() };
        }
        // Try "alias name"=alias data
        match = content.match(/^"([^"]+)"\s*=\s*([^\s"]+)\s*$/);
        if (match) {
            return { alias: match[1].trim(), value: match[2].trim() };
        }
        // Try "alias name" "alias data"
        match = content.match(/^"([^"]+)"\s+"([^"]+)"\s*$/);
        if (match) {
            return { alias: match[1].trim(), value: match[2].trim() };
        }
        // Try "alias name" alias data
        match = content.match(/^"([^"]+)"\s+(.+)$/);
        if (match) {
            return { alias: match[1].trim(), value: match[2].trim() };
        }
        // Try aliasname alias data
        match = content.match(/^([^\s"]+)\s+(.+)$/);
        if (match) {
            return { alias: match[1].trim(), value: match[2].trim() };
        }
        // Fallback: treat everything as alias, no value
        return { alias: content.trim(), value: "" };
    },
    async function execute({ invoker, guild_config, args }) {
        if (!args.alias || !args.value) {
            await action.reply(invoker, { content: "you must provide both an alias and a value", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: "missing alias or value" });
        }
        const usedAlias = (args.alias.startsWith(guild_config.other.prefix) ? args.alias.slice(guild_config.other.prefix.length) : args.alias)
        const existing = await getAlias(invoker.author.id, usedAlias);
        if (existing) {
            await action.reply(invoker, { content: `alias \`${usedAlias}\` already exists, use \`${guild_config.other.prefix}alias delete ${usedAlias}\` to get rid of it.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: "alias already exists" });
        }
        if (usedAlias.startsWith("alias")) {
            await action.reply(invoker, { content: `you cannot create an alias that starts with \`${guild_config.other.prefix}alias\`, please choose a different name. this is to prevent locking yourself out of editing aliases.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: "invalid alias name" });
        }
        const aliasObj = new Alias({ id: 0, userId: invoker.author.id, alias: usedAlias, value: args.value, write: Alias.prototype.write, delete: Alias.prototype.delete });
        await aliasObj.write();
        await action.reply(invoker, { content: `aliased \`${guild_config.other.prefix}${aliasObj.alias}\` to \`${guild_config.other.prefix}${aliasObj.value}\`, run \`${guild_config.other.prefix}${aliasObj.alias}\` to try it out.`, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const del = new Command(
    {
        name: "delete",
        description: "delete an alias by name",
        long_description: "delete one of your aliases by using its name",
        tags: [CommandTag.Utility],
        pipable_to: [],
        aliases: ["remove", "del", "rm"],
        options: [
            new CommandOption({
                name: "alias",
                description: "the alias name to delete",
                type: CommandOptionType.String,
                required: true,
            })
        ],
        example_usage: "p/alias delete greet",
        argument_order: "<alias>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringWholeMessage, ["alias"]),
    async function execute({ invoker, guild_config, args }) {
        if (!args.alias) {
            await action.reply(invoker, { content: "you must provide the alias name to delete", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: "missing alias name" });
        }
        const usedAlias = args.alias.startsWith(guild_config.other.prefix) ? args.alias.slice(guild_config.other.prefix.length) : args.alias;
        const alias = await getAlias(invoker.author.id, usedAlias);
        if (!alias) {
            await action.reply(invoker, { content: `alias \`${args.alias}\` not found, use \`${guild_config.other.prefix}alias list\` to see your aliases.`, ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({ error: true, message: `alias not found; use` });
        }
        await alias.delete();
        await action.reply(invoker, { content: `deleted alias \`${args.alias}\` `, ephemeral: guild_config.other.use_ephemeral_replies });
        return new CommandResponse({});
    }
);

const list = new Command(
    {
        name: "list",
        description: "list your aliases",
        long_description: "list all aliases you have created",
        tags: [CommandTag.Utility],
        pipable_to: [],
        aliases: ["ls", "show"],
        options: [],
        example_usage: "p/alias list",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.DoNothing),
    async function execute({ invoker, guild_config }) {
        const aliases = await listAliases(invoker.author.id);
        if (!aliases.length) {
            await action.reply(invoker, { content: "no aliases found", ephemeral: guild_config.other.use_ephemeral_replies });
            return new CommandResponse({});
        }
        await action.reply(invoker, {
            components: [
                new Container({
                    components: [
                        new TextDisplay({
                            content: `### ${invoker.author.username}'s aliases: `,
                        }),
                        new Separator(),
                        new TextDisplay({
                            content: aliases.map(a => `**${guild_config.other.prefix}${a.alias}**: ${a.value}`).join("\n"),
                        })
                    ]
                })
            ],
            components_v2: true,
            ephemeral: guild_config.other.use_ephemeral_replies
        });
        return new CommandResponse({});
    }
);

const aliasCommand = new Command(
    {
        name: "alias",
        description: "manage your command aliases",
        long_description: "create and manage your command aliases\naliases are incredibly powerful, as the content in the message is directly replaced, so you can alias several commands being piped together, or a command with arguments, or just a simple command name.",
        tags: [CommandTag.Utility],
        pipable_to: [],
        subcommands: {
            deploy: SubcommandDeploymentApproach.Split,
            list: [create, list, del],
        },
        options: [],
        example_usage: "p/alias create \"greet\"=\"echo Hello!\"",
        aliases: ["aliases", "aliasmanager", "aliasman"],
        not_pipable: true,
        argument_order: "<subcommand>",
    },
    getArgumentsTemplate(GetArgumentsTemplateType.SingleStringFirstSpace, ["subcommand"]),
    async function execute({ invoker, args, guild_config }) {
        if (args.subcommand) {
            action.reply(invoker, {
                content: `invalid subcommand: ${args.subcommand}; use any of the following subcommands:\n\`${guild_config.other.prefix}alias create\`: create a new alias\n\`${guild_config.other.prefix}alias delete\`: delete an existing alias\n\`${guild_config.other.prefix}alias list\`: list your aliases`,
                ephemeral: guild_config.other.use_ephemeral_replies,
            });
            return;
        }
        await action.reply(invoker, {
            content: `this command does nothing if you don't supply a subcommand. use any of the following subcommands:\n\`${guild_config.other.prefix}alias create\`: create a new alias\n\`${guild_config.other.prefix}alias delete\`: delete an existing alias\n\`${guild_config.other.prefix}alias list\`: list your aliases`,
            ephemeral: guild_config.other.use_ephemeral_replies,
        });
    }
);

export default aliasCommand;
