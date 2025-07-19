import * as log from '../lib/log';
import { Response } from 'express';
import { RESTPostOAuth2AccessTokenResult, Routes } from 'discord.js';
import { APIUser } from 'discord-api-types/v10';

const discordApi = "https://discord.com/api/v10";
const nameToken = "LIBERAL_LIES";
const nameRefreshToken = "CIA_MONITORING_ACTIVE";
const cookieExp = 1000 * 60 * 60 * 24 * 365; // 1 year

const isDev = process.env.IS_DEV?.toLowerCase() == "true";
let botId: string;
try {
    botId = process.env.DISCORD_CLIENT_ID || process.env.DISCORD_OAUTH_CLIENT_ID || "";
} catch (err) {
    log.error("Failed to fetch client ID, defaulting to fallback ID. Error:", err);
    botId = "111111111111111111111";
}
const port = 53134; // TODO: fetch this from above file; not very possible. it is Hell
export const oauth2Url = `https://discord.com/oauth2/authorize?client_id=${botId}&response_type=code&redirect_uri=${(isDev ? `http%3A%2F%2Flocalhost%3A${port}%2Fauth` : "https%3A%2F%2Fpepperbot.online%2Fauth")}&scope=identify+guilds`;

export async function updateCookies(res: Response, token: string, refreshToken: string) {
    const exp = new Date(Date.now() + cookieExp);
    if (token) { res.cookie(nameToken, token, { expires: exp, sameSite: "strict" }) };
    if (refreshToken) { res.cookie(nameRefreshToken, refreshToken, { expires: exp, sameSite: "strict" }) };
}

export async function getToken(code: string) {
    try {
        return await fetch(discordApi + Routes.oauth2TokenExchange(), {
            method: "POST",
            body: new URLSearchParams({
                client_id: botId,
                client_secret: process.env.DISCORD_CLIENT_SECRET || "",
                grant_type: "authorization_code",
                code: code,
                redirect_uri: (isDev ? `http://localhost:${port}/auth` : "https://pepperbot.online/auth")
            })
        }).then(res => res.json()) satisfies RESTPostOAuth2AccessTokenResult;
    } catch (err) {
        log.error(err);
        return;
    }
}

export async function getRefreshToken(refreshToken: string) {
    try {
        return await fetch(discordApi + Routes.oauth2TokenExchange(), {
            method: "POST",
            body: new URLSearchParams({
                client_id: botId,
                client_secret: process.env.DISCORD_CLIENT_SECRET || "",
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                redirect_uri: (isDev ? `http://localhost:${port}/auth` : "https://pepperbot.online/auth")
            })
        }).then(res => res.json()) satisfies RESTPostOAuth2AccessTokenResult;
    } catch (err) {
        log.error(err);
        return;
    }
}

interface OAuth2Error {
    message: string,
    code: number
}

export async function getUser(token: string): Promise<APIUser | OAuth2Error | undefined> {
    try {
        return await fetch(discordApi + Routes.user('@me'), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(res => res.json() as Promise<APIUser>);
    } catch (err) {
        log.error(err);
        return;
    }
}