import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import cookieParser from "cookie-parser";
import { getRefreshToken, getToken, oauth2Url, updateCookies } from "./oauth2";
import { getStatistics } from "../lib/statistics";
import { ApplicationIntegrationType, Client, InteractionContextType, Options } from "discord.js";
import commands from "../lib/command_manager";
import { CommandEntryType, CommandOptionType, CommandTag } from "../lib/classes/command_enums";
import { Command } from "../lib/classes/command";
import { CommandAccessTemplates } from "../lib/templates";

const port = 53134
const isDev = process.env.IS_DEV === "True";

class HttpException extends Error {
    public status?: number;
    // message is not nullable, it is already in the Error class
    // yayy :heart:
    public message: string;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

const argTypeIndex: Record<CommandOptionType, string> = {
    [CommandOptionType.Subcommand]: "subcommand",
    [CommandOptionType.SubcommandGroup]: "subcommand_group",
    [CommandOptionType.String]: "string",
    [CommandOptionType.Integer]: "integer",
    [CommandOptionType.Boolean]: "boolean",
    [CommandOptionType.User]: "user",
    [CommandOptionType.Channel]: "channel",
    [CommandOptionType.Role]: "role",
    [CommandOptionType.Mentionable]: "mentionable",
    [CommandOptionType.Number]: "number",
    [CommandOptionType.Attachment]: "attachment",
};

const integrationTypesIndex: Record<ApplicationIntegrationType, string> = {
    [ApplicationIntegrationType.GuildInstall]: "guild install",
    [ApplicationIntegrationType.UserInstall]: "user install"
}

const contextsIndex: Record<InteractionContextType, string> = {
    [InteractionContextType.Guild]: "Guild",
    [InteractionContextType.BotDM]: "Bot DM",
    [InteractionContextType.PrivateChannel]: "Private Channel"
}

export function listen(client: Client) {
    const app = express();
    const hbs = create();

    app.engine("handlebars", hbs.engine);
    app.set("view engine", "handlebars");
    app.set("views", "./views");

    app.use(cookieParser());

    // lander

    app.get("/", async (req, res, next) => {
        try {
            const guilds = client.guilds.cache.size;
            const users = client.users.cache.size;

            // Check if the user has visited before using a cookie
            const hasVisited = req.cookies.hasVisited === "true";
            const animateClass = hasVisited ? "" : "animate";

            // Set a cookie to mark the user as having visited
            if (!isDev) res.cookie("hasVisited", "true", { maxAge: 2 * 60 * 60 * 1000 }); // 2 hours expiration

            const statistics = await getStatistics();
            if (!statistics) {
                // fallback to empty object if statistics fails to load
                log.error("Failed to load statistics");
            }
            let executionTimesAverages: Record<string, number> = {};
            Object.entries(statistics?.execution_times).forEach(([key, value]) => {
                executionTimesAverages[key] = Math.round(value.reduce((sum, num) => sum + num, 0) / value.length);
            });
            executionTimesAverages = Object.fromEntries(
                Object.entries(executionTimesAverages).sort(([, a], [, b]) => {
                    // sort the execution times by average time (highest to lowest)
                    return b - a;
                })
            );
            let commandUsageSorted = Object.entries(statistics?.command_usage || {}).sort(([, a], [, b]) => {
                // sort the command usage by count (highest to lowest)
                return b - a;
            });
            const formattedStatistics = {
                "execution times": Object.fromEntries(
                    Object.entries(executionTimesAverages)
                        .slice(0, 20) // limit to 10 entries
                        .map(([command, time]) => {
                            // format the execution times for display
                            return [`p/${command}`, `${time}ms`];
                        })
                ),
                "command usage": Object.fromEntries(
                    commandUsageSorted
                        .slice(0, 20) // limit to 10 entries
                        .map(([command, count]) => {
                            // format the command usage for display
                            return [`p/${command}`, count];
                        })
                ),
                "invoker type usage": Object.fromEntries(
                    Object.entries(statistics?.invoker_type_usage || {}).map(([type, count]) => {
                        // format the invoker type usage for display
                        return [type, count];
                    })
                ),
                "totals": {
                    "gpt responses": statistics?.total_gpt_responses || 0, // total gpt responses
                    "command usage": Object.values(statistics?.command_usage || {}).reduce((sum, count) => sum + count, 0),
                    "piped commands": statistics?.total_piped_commands || 0 // total piped commands
                },
            };

            res.render("index", {
                title: "landing",
                description: "PepperBot",
                path: "/",
                guilds,
                users,
                animateClass,
                guildsPlural: guilds !== 1 ? "s" : "",
                usersPlural: users !== 1 ? "s" : "",
                statistics: formattedStatistics,
            });
        } catch (err) {
            next(err);
        }
    });

    // oauth2 auth

    app.get("/auth", async (req, res, next) => {
        if (req.cookies.refreshToken && !req.cookies.token) {
            const token = await getRefreshToken(req.cookies.refreshToken);
            // assume the refresh token is invalid, and not internal server error
            // we still log the error in above func just in case lol
            // see what we did below mayb
            if (token.error) {
                return res.redirect(oauth2Url);
            } else {
                updateCookies(res, token.access_token, token.refresh_token);
                return res.redirect('/'); // todo: implement redirect system
            }
        }

        // ???
        // Black magic
        const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
        if (!code || typeof code !== 'string') {
            return res.redirect(oauth2Url);
        }

        const token = await getToken(code);
        if (token.error) {
            // do something like this in the above part (refresh token)
            if (token.error_description === 'Invalid "code" in request.') { return res.redirect(oauth2Url); }
            else { return next(new HttpException(500, token.error)); }
        } else {
            updateCookies(res, token.access_token, token.refresh_token);
            return res.redirect('/'); // todo: implement redirect system
        }
    });

    // api endpoints (json)
    // use these for client-side ui, etc
    // try and do as much as possible server-side

    // app.get("/api/status", (_req, res) => {
    //     res.json({
    //         guilds: client.guilds.cache.size,
    //         users: client.users.cache.size
    //     })
    // })
    function formatCommand(command: Command, selectedCommand: string, selectedSubcommand?: string): any {
        const name = command.name;
        const whitelistOnly = command.tags.includes(CommandTag.WhitelistOnly)
        return {
                whitelistOnly: whitelistOnly ? "command-whitelist-only" : "",
                ...command,
                usage: Array.isArray(command.example_usage) ? command.example_usage.map((value, index) => {
                    return `EXAMPLE ${index + 1}: ${value}`;
                }) : ["EXAMPLE: " + command.example_usage],
                argOrder: command.options.filter((option) => option.type !== CommandOptionType.Subcommand).length === 0
                    ? undefined
                    : `p/${command.parent_command ? command.parent_command + " " : ""}${name} ` + (command.argument_order.length > 0
                        ? command.argument_order
                        : "<" + command.options.map((option) => option.name).join("> <") + ">"),
                isPreSelected: (selectedCommand === name) || selectedCommand === (command.parent_command + " " + name),
                arguments: (command.options.filter((option) => option.type !== CommandOptionType.Subcommand).length === 0) ? undefined : command.options.filter((option) => option.type !== CommandOptionType.Subcommand).map((option) => {
                    return {
                        argType: argTypeIndex[option.type],
                        ...option,
                    }
                }),
                meta: {
                    integration_types: command.integration_types.map((type) => integrationTypesIndex[type]).join(", "),
                    contexts: command.contexts.map((type) => contextsIndex[type]).join(", "),
                    nsfw: new String(command.nsfw),
                    aliases: (command.aliases.length > 0)
                        ? (
                            command.parent_command
                                ? command.aliases.map(alias => `p/${command.parent_command} ${alias}`).join(", ")
                                : command.aliases.map(alias => `p/${alias}`).join(", ")
                        )
                        : undefined,
                    rootAliases: command.root_aliases.length > 0 ? command.root_aliases.map(alias => `p/${alias}`).join(", ") : undefined,
                    parent: command.parent_command ? command.parent_command : undefined,
                },
                subcommands: (command.subcommands?.list.length || -1) > 0 ? command.subcommands?.list.map((subcommand) => {
                    return {
                        name: subcommand.name,
                        parentName: subcommand.parent_command,
                        tags: subcommand.tags,
                        isPreSelected: selectedSubcommand === (subcommand.parent_command + " " + subcommand.name),
                    }
                }) : undefined,
            }
    }

    app.get("/commands", (req, res, next) => {
        let formattedCommands: any[] = [];
        let formattedSubcommands: any[] = [];
        const selectedCommand = req.query.command
        const selectedSubcommand = req.query.command + " " + req.query.subcommand

        commands.mappings.forEach((entry) => {
            if (entry.type === CommandEntryType.Command) {
                const command = entry.command as Command;

                formattedCommands.push(formatCommand(command, selectedCommand as string, selectedSubcommand as string));
                if (command.subcommands && command.subcommands.list.length > 0) {
                    command.subcommands.list.forEach((subcommand) => {
                        formattedSubcommands.push(formatCommand(subcommand, selectedSubcommand as string));
                    });
                }
            }
        });

        // Sort so that whitelist-only commands appear towards the bottom
        formattedCommands = formattedCommands.sort((a, b) => {
            return Number(a.whitelistOnly !== "") - Number(b.whitelistOnly !== "");
        });

        return res.render("commands", {
            title: "commands",
            description: "a list of all commands and their usage",
            path: "/commands" + (req.query.name ? `/${req.query.name}` : ""),
            commands: formattedCommands.filter((entry) => entry !== null),
            subcommands: formattedSubcommands.filter((entry) => entry !== null),
        });
    })

    app.get("/commands/:name", (req, res, next) => {
        res.redirect("/commands?command=" + req.params.name);
    });
    app.get("/commands/:name/:subcommand", (req, res, next) => {
        res.redirect("/commands?command=" + req.params.name + "&subcommand=" + req.params.subcommand);
    });

    app.use(express.static("public"));

    // errors

    app.use((req, _res, next) => {
        const error = new HttpException(404, `${req.path} not found`);

        next(error);
    })

    app.use((err: HttpException, req: Request, res: Response, _next: NextFunction) => {
        // only log errors / 500s
        if (!err.status || (err.status < 600 && err.status >= 500)) {
            log.error(err);
        }

        const status = err.status ?? 500;
        const message = err.message;

        res.status(status).render("error", {
            title: "error",
            description: `${status}: ${message}`,
            path: req.path,
            status: status,
            message: message
        });
    })

    app.listen(port, () => log.info(`web interface started on port ${port}`));
}
