import { Router, Request, Response, NextFunction } from "express";
import { getUser } from "../oauth2";
import { CommandAccessTemplates } from "../../lib/templates";
import * as fs from "fs";
import * as log from "../../lib/log";

export function createLogsRoutes(): Router {
    const router = Router();

    // Logs page
    router.get("/logs", async (req: Request, res: Response, next: NextFunction) => {
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

    // Logs API endpoints
    const whitelistOnlyLevels = ['debug', 'access'];
    const whitelist = CommandAccessTemplates.dev_only.whitelist.users;
    const linesCount = 100;

    router.get("/api/logs/:level/:line?", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const level = req.params.level.toLowerCase().trim().replaceAll(/[^[a-z]]*/g, ''); // avoids issues with users navigating around by putting in ../ and shit
            const levels = fs.readdirSync('./logs').map(file => file.replace('.log', ''));
            if (!levels.includes(level)) {
                res.json({ error: "log level " + level + " not found", status: 404 });
                return;
            }
            const user = await getUser(req.cookies.LIBERAL_LIES).catch(() => undefined);
            let whitelisted = false;
            if (user && typeof user === "object" && "id" in user && whitelist.includes(user.id ?? "not included :/")) {
                whitelisted = true;
            }
            if (!whitelisted && whitelistOnlyLevels.includes(level)) {
                res.json({ error: "user is not whitelisted for " + level, status: 403 });
                return;
            }

            const atLine = Number(req.params.line ?? 0);
            if (isNaN(atLine)) {
                res.json({ error: "invalid line number: " + req.params.line, status: 400 });
                return;
            }

            const logFile = `./logs/${level}.log`;
            if (!fs.existsSync(logFile)) {
                res.json({ error: "log file not found", status: 404 });
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

    return router;
}
