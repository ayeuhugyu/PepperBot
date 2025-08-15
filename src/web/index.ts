import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import cookieParser from "cookie-parser";
import { Client } from "discord.js";
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { initializeWebSocket } from "./websocket";

// Import page modules
import { createHomeRoutes } from "./pages/home";
import { createAuthRoutes } from "./pages/auth";
import { createLogsRoutes } from "./pages/logs";
import { createStatisticsRoutes } from "./pages/statistics";
import { createCommandsRoutes } from "./pages/commands";
import { createConfigRoutes } from "./pages/config";
import { createPromptsRoutes } from "./pages/prompts";
import { createSuggestionsRoutes } from "./pages/suggestions";

const httpPort = 53134;
const httpsPort = 4430; // changed to 4430 to avoid conflicts with port 443
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

    // Check if HTTPS certificates are provided
    const certPath = process.env.HTTPS_CERT_PATH;
    const keyPath = process.env.HTTPS_KEY_PATH;
    const useHttps = certPath && keyPath;

    // Always create HTTP server
    const httpServer = createServer(app);

    let httpsServer;
    if (useHttps) {
        try {
            const httpsOptions = {
                cert: readFileSync(certPath),
                key: readFileSync(keyPath)
            };
            httpsServer = createHttpsServer(httpsOptions, app);
            log.info('https server configured with provided certificates');
        } catch (error) {
            log.error('failed to read https certificates, https will not be available:', error);
        }
    }

    // Initialize WebSocket for HTTP server
    initializeWebSocket(httpServer);

    // Initialize WebSocket for HTTPS server if available (for WSS support)
    if (httpsServer) {
        initializeWebSocket(httpsServer);
    }

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
    app.use('/', createPromptsRoutes(client));
    app.use('/', createSuggestionsRoutes(client));

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

    // Start HTTP server
    httpServer.listen(httpPort, () => {
        log.info(`http server started on http://localhost:${httpPort}`);
        log.info(`websocket available at ws://localhost:${httpPort}`);
    });

    // Start HTTPS server if available
    if (httpsServer) {
        httpsServer.listen(httpsPort, () => {
            log.info(`https server started on https://localhost:${httpsPort}`);
            log.info(`secure websocket available at wss://localhost:${httpsPort}`);
        });
    }
}
