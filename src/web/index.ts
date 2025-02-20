import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import { getGuilds, getUsers } from "../lib/client_values_helpers";
import url from "url";

const oauth2url = "https://discord.com/oauth2/authorize?client_id=1209297323029565470&response_type=code&redirect_uri=https%3A%2F%2Fpepperbot.online%2Foauth2%2Flogin&scope=identify+guilds";

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

    // oauth2 auth

    app.get("/auth", async (req, res, next) => {
        const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
        if (!code || typeof code !== 'string') {
            // todo: implement refresh token
            return res.redirect(oauth2url);
        }
        const data = new url.URLSearchParams({
            'client_id': (process.env.IS_DEV == 'True') ? "1148796261793800303" : "1209297323029565470", // todo: fetch the client id instead of putting it as a string
            'client_secret': process.env.DISCORD_CLIENT_SECRET || '',
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': (process.env.IS_DEV == 'True') ? `http://localhost:${port}/auth` : 'https://pepperbot.online/auth',
            'scope': 'identify',
        });
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': process.env.DISCORD_TOKEN || '',
        };
        const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
            method: 'POST',
            body: data.toString(),
            headers: headers,
        });
        const output = await response.json(); // todo: implement types
        if (output.error) {
            return next(new HttpException(500, output.error));
        } else {
            //res.redirect(`/oauth2success?token=${output.access_token}&refreshToken=${output.refresh_token}&expires=${output.expires_in}`);
            res.cookie('token', output.access_token, { maxAge: output.expires_in * 1000 });
            res.cookie('refreshToken', output.refresh_token, { maxAge: output.expires_in * 1000 }); // todo: research if this is correct, i think it should be infinite.
        }
    });

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