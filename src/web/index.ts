import express, { NextFunction, Request, Response } from "express";
import { create } from "express-handlebars";
import * as log from "../lib/log";
import { getGuilds, getUsers, getClientId } from "../lib/client_values_helpers";
import url from "url";
import cookieParser from "cookie-parser";

const isDev = (process.env.IS_DEV?.toLowerCase() == 'true');
const botId = await getClientId();
console.log(botId);
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

enum GrantType {
    AuthorizationCode = 'authorization_code',
    RefreshToken = 'refresh_token'
}

interface OAuth2Response {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    error?: string;
    error_description?: string;
}

async function oauth2(code: string, grant_type: GrantType, port: number) {
    const codeType = (grant_type === GrantType.RefreshToken) ? 'refresh_token' : 'code'
    const data = new url.URLSearchParams({
        'client_id': botId,
        'client_secret': process.env.DISCORD_CLIENT_SECRET || '',
        'grant_type': grant_type,
        [codeType]: code,
        'redirect_uri': isDev ? `http://localhost:${port}/auth` : 'https://pepperbot.online/auth',
    });

    if (grant_type !== GrantType.RefreshToken) {
        data.append('scope', 'identify+guilds'); // refresh tokens error if you try to include scope
    }
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': process.env.DISCORD_TOKEN || '',
    };
    const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
        method: 'POST',
        body: data.toString(),
        headers: headers,
    });
    return await response.json() as OAuth2Response;
}

const infinite_cookie_age = 2147483647; // 2^31 - 1
function setAuthCookies(res: Response, output: any) {
    res.cookie('token', output.access_token, { maxAge: output.expires_in * 1000 });
    res.cookie('refreshToken', output.refresh_token, { maxAge: infinite_cookie_age });
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
const oauth2url = `https://discord.com/oauth2/authorize?client_id=${botId}&response_type=code&redirect_uri=${(isDev ? `http%3A%2F%2Flocalhost%3A${port}%2Fauth` : "https%3A%2F%2Fpepperbot.online%2Fauth")}&scope=identify+guilds`;

app.get("/auth", async (req, res, next) => {
    if (req.cookies.refreshToken && !req.cookies.token) {
        const output = await oauth2(req.cookies.refreshToken, GrantType.RefreshToken, port);
        if (output.error) {
            return next(new HttpException(500, output.error + "; you may have to reauthenticate."));
        } else {
            setAuthCookies(res, output);
            return res.redirect('/'); // todo: implement redirect system
        }
    }
    const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
    if (!code || typeof code !== 'string') {
        return res.redirect(oauth2url);
    }
    const output = await oauth2(code, GrantType.AuthorizationCode, port);
    if (output.error) {
        if (output.error_description && output.error_description === "Invalid \"code\" in request.") {
            return next(new HttpException(403, "Invalid OAuth2 code, try reauthenticating. "))
        }
        return next(new HttpException(500, output.error));
    } else {
        setAuthCookies(res, output);
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
        path: req.path,
        status: status,
        message: message
    });
})

app.listen(port, () => log.info(`web interface started on port ${port}`));