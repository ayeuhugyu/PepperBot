import { Router, Request, Response, NextFunction } from "express";
import { Client } from "discord.js";
import * as log from "../../lib/log";

export function createComedicRoutes(): Router {
    const router = Router();

    router.get("/cgi-bin/*", async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.redirect("https://plaskinino.horse");
        } catch (err) {
            next(err);
        }
    });

    router.get("/sludge", async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.redirect("https://sludge.de");
        } catch (err) {
            next(err);
        }
    });

    return router;
}
