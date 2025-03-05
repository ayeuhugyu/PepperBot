import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import { getGuilds, getUsers } from "../lib/client_values_helpers";
import cookieParser from "cookie-parser";
import { getRefreshToken, getToken, oauth2Url, updateCookies } from "./oauth2";
import path from "node:path";

const port = 53134

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

const app = express();
const hbs = create();

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(cookieParser());

// lander

app.get("/", async (_req, res, next) => {
    try {
        const guilds = await getGuilds();
        const users = await getUsers();
        res.render("index", {
            title: "landing",
            description: "PepperBot",
            path: "/",
            guilds,
            users,
            guildsPlural: guilds !== 1 ? "s" : "",
            usersPlural: users !== 1 ? "s" : ""
        });
    } catch (err) {
        next(err);
    }
})

// oauth2 auth

app.get("/auth", async (req, res, next) => {
    if (req.cookies.refreshToken && !req.cookies.token) {
        const token = await getRefreshToken(req.cookies.refreshToken);
        // assume the refresh token is invalid, and not internal server error
        // we still log the error in above func just in case lol
        // see what we did below mayb
        if (token.error) {
            return res.redirect(oauth2Url);
        } else {
            updateCookies(res, token.access_token, token.refresh_token);
            return res.redirect('/'); // todo: implement redirect system
        }
    }

    // ???
    // Black magic
    const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
    if (!code || typeof code !== 'string') {
        return res.redirect(oauth2Url);
    }

    const token = await getToken(code);
    if (token.error) {
        // do something like this in the above part (refresh token)
        if (token.error_description === 'Invalid "code" in request.') { return res.redirect(oauth2Url); }
        else { return next(new HttpException(500, token.error)); }
    } else {
        updateCookies(res, token.access_token, token.refresh_token);
        return res.redirect('/'); // todo: implement redirect system
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
        description: `${status}: ${message}`,
        path: req.path,
        status: status,
        message: message
    });
})

app.listen(port, () => log.info(`web interface started on port ${port}`));