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

            res.render("index", {
                title: "landing",
                description: "PepperBot",
                path: "/",
                stylesheet: "index.css",
                guilds,
                users,
                guildsPlural: guilds !== 1 ? "s" : "",
                usersPlural: users !== 1 ? "s" : "",
            });
        } catch (err) {
            next(err);
        }
    });

    // invite redirect

    app.get("/invite", async (req, res, next) => {
        try {
            res.redirect("https://discord.com/oauth2/authorize?client_id=1209297323029565470");
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

    app.use(express.static("public"));

    // statistics page

    app.get("/statistics", async (req, res, next) => {
        try {
            const statistics = await getStatistics();
            const guilds = client.guilds.cache.size;
            const users = client.users.cache.size;

            // Calculate average execution timess
            let avgExecutionTimes: Record<string, string> = {};
            for (const command in statistics.execution_times) {
                const times = statistics.execution_times[command];
                avgExecutionTimes["p/" + command] = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0);
            }
            const sortedAvgExecutionTimes = Object.fromEntries(Object.entries(avgExecutionTimes).sort(([,a], [,b]) => Number(b) - Number(a)));

            // Sort commands by usage
            const sortedCommandUsage = Object.entries(statistics.command_usage)
                .sort(([,a], [,b]) => b - a)
                .map(([command, usage]) => [`p/${command}`, usage]);

            // Sort models by usage
            const sortedModelUsage = Object.entries(statistics.gpt_model_usage)
                .sort(([,a], [,b]) => b - a)
                .filter(([,usage]) => usage > 0);

            res.render("statistics", {
                title: "statistics",
                description: "PepperBot Statistics",
                path: "/statistics",
                stylesheet: "statistics.css",
                guilds,
                users,
                totalCommands: Object.values(statistics.command_usage).reduce((a, b) => a + b, 0),
                totalGptResponses: Object.values(statistics.gpt_model_usage).reduce((a, b) => a + b, 0),
                totalPipedCommands: statistics.total_piped_commands,
                commandUsage: sortedCommandUsage,
                avgExecutionTimes: sortedAvgExecutionTimes,
                modelUsage: sortedModelUsage,
                invokerUsage: [
                    { type: "Slash Commands", count: statistics.invoker_type_usage.interaction },
                    { type: "Text Commands", count: statistics.invoker_type_usage.message }
                ]
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
            stylesheet: "error.css",
            path: req.path,
            status: status,
            message: message
        });
    })

    app.listen(port, () => log.info(`web interface started on port ${port}`));
}
