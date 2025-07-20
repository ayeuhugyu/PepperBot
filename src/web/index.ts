import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import cookieParser from "cookie-parser";
import { Client } from "discord.js";
import { createServer } from 'http';
import { initializeWebSocket } from "./websocket";

// Import page modules
import { createHomeRoutes } from "./pages/home";
import { createAuthRoutes } from "./pages/auth";
import { createLogsRoutes } from "./pages/logs";
import { createStatisticsRoutes } from "./pages/statistics";
import { createCommandsRoutes } from "./pages/commands";
import { createConfigRoutes } from "./pages/config";

const port = 53134
const isDev = process.env.IS_DEV === "True";

class HttpException extends Error {
    private type: string = "error"; // this is just so api responses using this are more manageable
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
    const hbs = create({
        helpers: {
            join: function(array: string[], separator: string) {
                return Array.isArray(array) ? array.join(separator) : '';
            },
            substring: function(str: string, start: number, end?: number) {
                return str ? str.substring(start, end) : '';
            },
            eq: function(a: any, b: any) {
                return a === b;
            },
            or: function(a: any, b: any) {
                return a || b;
            },
            and: function(a: any, b: any) {
                return a && b;
            },
            lookup: function(obj: any, key: string) {
                return obj && obj[key];
            },
            json: function(obj: any) {
                return JSON.stringify(obj);
            }
        }
    });

    initializeWebSocket(server);

    app.engine("handlebars", hbs.engine);
    app.set("view engine", "handlebars");
    app.set("views", "./views");

    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Access logging middleware
    app.use((req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        const page = req.path;

        log.access(`${ip} - ${page}`);
        next();
    });

    // Static files
    app.use(express.static("public"));

    // Register page routes
    app.use('/', createHomeRoutes(client));
    app.use('/', createAuthRoutes());
    app.use('/', createLogsRoutes());
    app.use('/', createStatisticsRoutes(client));
    app.use('/', createCommandsRoutes());
    app.use('/', createConfigRoutes(client));

    // Error handlers
    app.use((req, _res, next) => {
        const error = new HttpException(404, `${req.path} not found`);
        next(error);
    });

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
    });

    server.listen(port, () => log.info(`web interface started on port ${port}`));
}
