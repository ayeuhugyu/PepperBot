import { Router, Request, Response, NextFunction } from "express";
import { Client } from "discord.js";

export function createPromptsRoutes(client: Client): Router {
    const router = Router();

    // Prompts page
    router.get("/prompts", async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.render("under-construction", {
                title: "prompts",
                description: "PepperBot Prompts - Under Construction",
                path: "/prompts",
                stylesheet: "construction.css",
                pageName: "Prompts",
                backUrl: "/"
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
