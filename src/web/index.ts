import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";

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

    app.get("/", async (_req, res) => {
        const guildsResponse: { data: number[] } | { error: string } = await fetch("http://localhost:49999/fetchClientValues", { method: "POST", 
            body: JSON.stringify({ property: "guilds.cache.size" }), 
            headers: { "Content-Type": "application/json" } }).then(async (response) => await response.json());
        const usersResponse: { data: number[] } | { error: string } = await fetch("http://localhost:49999/fetchClientValues", { method: "POST", 
            body: JSON.stringify({ property: "users.cache.size" }), 
            headers: { "Content-Type": "application/json" } }).then(async (response) => await response.json());

        if ("error" in guildsResponse || "error" in usersResponse) {
            let errorMessage
            if ("error" in guildsResponse) errorMessage = guildsResponse.error;
            else if ("error" in usersResponse) errorMessage = usersResponse.error; // theres probably a more elegant way of doing this but i dont care enough

            return res.render("error", { // realistically this should never happen. also this might not be the appropriatte error handling i dunno how ur shit works
                title: "error",
                status: 500,
                path: _req.path,
                message: "failed to fetch data: " + errorMessage
            })
        }

        if (!Array.isArray(guildsResponse.data) || !Array.isArray(usersResponse.data)) {
            return res.render("error", { // realistically this should never happen. also this might not be the appropriatte error handling i dunno how ur shit works
                title: "error",
                status: 500,
                path: _req.path,
                message: "guild or user response was not valid"
            })
        }
        // you could probably turn most of the above stuff into helper functions so its usable in other things easily but im lazy asf
        const guilds = guildsResponse.data.reduce((prev, val) => prev + val, 0);
        const users = usersResponse.data.reduce((prev, val) => prev + val, 0);

        res.render("index", {
            title: "landing",
            guilds: guilds,
            users: users
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