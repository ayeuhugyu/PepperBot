import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import cookieParser from "cookie-parser";
import { getRefreshToken, getToken, getUser, oauth2Url, updateCookies } from "./oauth2";
import { getStatistics } from "../lib/statistics";
import commands from "../lib/command_manager";
import { CommandEntryType } from "../lib/classes/command_enums";
import { CommandAccessTemplates } from "../lib/templates";
import * as fs from "fs";
import { APIUser } from 'discord-api-types/v10';
import { createServer } from 'http';
import { initializeWebSocket } from "./websocket";
import { Client } from "discord.js";

const port = 53134
const isDev = process.env.IS_DEV === "True";

class HttpException extends Error {
    private type: string = "error"; // this is just so api responses using this are more managable
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

export function listen(client: Client) {
    const app = express();
    const server = createServer(app);
    const hbs = create();

    initializeWebSocket(server);

    app.engine("handlebars", hbs.engine);
    app.set("view engine", "handlebars");
    app.set("views", "./views");

    app.use(cookieParser());

    // Access logging middleware
    app.use((req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        const page = req.path;

        log.access(`${ip} - ${page}`);
        next();
    });

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

    // logs page

    app.get("/logs", async (req, res, next) => {
        try {
            let username = "authenticated: N/A";

            // Try to get authenticated user
            if (req.cookies.LIBERAL_LIES) {
                try {
                    const user = await getUser(req.cookies.LIBERAL_LIES);
                    if (user && typeof user === "object" && "username" in user) {
                        username = "authenticated: " + user.username as string;
                    }
                } catch (error) {}
            }

            res.render("logs", {
                title: "logs",
                description: "PepperBot Logs",
                path: "/logs",
                stylesheet: "logs.css",
                username: username
            });
        } catch (err) {
            next(err);
        }
    });

    // logs api endpoints

    const whitelistOnlyLevels = ['debug', 'access'];
    const whitelist = CommandAccessTemplates.dev_only.whitelist.users;
    const linesCount = 100;
    app.get("/api/logs/:level/:line?", async (req, res, next) => {
        try {
            const level = req.params.level.toLowerCase().trim().replaceAll(/[^[a-z]]*/g, ''); // avoids issues with users navigating around by putting in ../ and shit
            const levels = fs.readdirSync('./logs').map(file => file.replace('.log', ''));
            if (!levels.includes(level)) {
                res.json(new HttpException(404, "log level " + level + " not found"));
                return;
            }
            const user = await getUser(req.cookies.LIBERAL_LIES).catch(() => undefined);
            let whitelisted = false;
            if (user && typeof user === "object" && "id" in user && whitelist.includes(user.id ?? "not included :/")) {
                whitelisted = true;
            }
            if (!whitelisted && whitelistOnlyLevels.includes(level)) {
                res.json(new HttpException(403, "user is not whitelisted for " + level));
                return;
            }

            const atLine = Number(req.params.line ?? 0);
            if (isNaN(atLine)) {
                res.json(new HttpException(400, "invalid line number: " + req.params.line));
                return;
            }

            const logFile = `./logs/${level}.log`;
            if (!fs.existsSync(logFile)) {
                res.json(new HttpException(404, "log file not found"));
                return;
            }

            const fullFile = fs.readFileSync(logFile, "utf-8");
            const lines = fullFile.split("\n").reverse().slice(atLine, atLine + linesCount);
            res.json({
                type: "success",
                data: lines,
                at: atLine,
                level: level,
                total: linesCount
            });
            return;
        } catch (err) {
            next(err);
        }
    });

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

    // commands page

    app.get("/commands", async (req, res, next) => {
        try {
            // Get all unique commands from the manager
            const commandEntries = Array.from(commands.mappings.values());
            const uniqueCommands = [];

            // Filter to only get primary commands (not aliases) and store unique commands
            for (const entry of commandEntries) {
                if (entry.type === CommandEntryType.Command && !entry.command.is_sub_command) {
                    uniqueCommands.push({
                        name: entry.command.name,
                        description: entry.command.description,
                        long_description: entry.command.long_description,
                        hasSubcommands: entry.command.subcommands?.list && entry.command.subcommands.list.length > 0,
                        subcommandCount: entry.command.subcommands?.list?.length || 0,
                        isPublic: !Object.values(entry.command.access.whitelist).some(list => list.length > 0),
                        tags: entry.command.tags.map(tag => tag.replace('#', ''))
                    });
                }
            }

            // Sort commands alphabetically
            uniqueCommands.sort((a, b) => a.name.localeCompare(b.name));

            res.render("commands", {
                title: "commands",
                description: "PepperBot Commands",
                path: "/commands",
                stylesheet: "commands.css",
                commands: uniqueCommands,
                totalCommands: uniqueCommands.length
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

    server.listen(port, () => log.info(`web interface started on port ${port}`));
}
