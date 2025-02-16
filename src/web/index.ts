import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import { client } from "../bot";

class HttpException extends Error {
    public status: number;
    public message: string;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

export async function startServer(port: number) {
    const app = express();
    const hbs = create();

    app.engine("handlebars", hbs.engine);
    app.set("view engine", "handlebars");
    app.set("views", "./views");

    app.use(express.static("public"));

    // lander

    app.get("/", (_req, res) => {
        res.render("index", {
            title: "landing",
            guilds: client.guilds.cache.size,
            users: client.users.cache.size
        });
    })

    // api endpoints (json)
    // use these for client-side ui, etc
    // try and do as much as possible server-side

    // app.get("/api/status", (_req, res) => {
    //     res.json({
    //         guilds: client.guilds.cache.size,
    //         users: client.users.cache.size
    //     })
    // })

    // errors

    app.use((req, _res, next) => {
        const error = new HttpException(404, `${req.path} not found`);

        next(error);
    })

    app.use((err: HttpException, req: Request, res: Response, _next: NextFunction) => {
        log.error(err);

        const status = err.status ?? 500;
        const message = err.message ?? "internal server error";

        res.status(status).render("error", {
            title: "error",
            path: req.path,
            status: status,
            message: message
        });
    })

    app.listen(port, () => log.info(`web interface started on port ${port}`));
}