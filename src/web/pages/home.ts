import { Router, Request, Response, NextFunction } from "express";
import { Client } from "discord.js";
import { oauth2Url } from "../oauth2";
import * as log from "../../lib/log";

export function createHomeRoutes(client: Client): Router {
    const router = Router();

    // Landing page
    router.get("/", async (req: Request, res: Response, next: NextFunction) => {
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

    // Invite redirect
    router.get("/invite", async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.redirect("https://discord.com/oauth2/authorize?client_id=1209297323029565470");
        } catch (err) {
            next(err);
        }
    });

    return router;
}
