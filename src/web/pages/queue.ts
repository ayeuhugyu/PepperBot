import { Router, Request, Response, NextFunction } from "express";
import { Client } from "discord.js";

export function createQueueRoutes(client: Client): Router {
    const router = Router();

    // Queue page
    router.get("/queue", async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.render("under-construction", {
                title: "queue",
                description: "PepperBot Queue - Under Construction",
                path: "/queue",
                stylesheet: "construction.css",
                pageName: "Queue",
                backUrl: "/"
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
