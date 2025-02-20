import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import { getGuilds, getUsers } from "../lib/client_values_helpers";
import Fingerprint from "express-fingerprint";

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

export async function startServer(port: number): Promise<void> {
    const app = express();
    const hbs = create();

    app.engine("handlebars", hbs.engine);
    app.set("view engine", "handlebars");
    app.set("views", "./views");
    app.use(Fingerprint())

    // lander

    app.get("/", async (_req, res, next) => {
        try {
            res.render("index", {
                title: "landing",
                guilds: await getGuilds(),
                users: await getUsers()
            });
        } catch (err) {
            next(err);
        }
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
            path: req.path,
            status: status,
            message: message
        });
    })

    app.listen(port, () => log.info(`web interface started on port ${port}`));
}