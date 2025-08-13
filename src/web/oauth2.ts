import * as log from '../lib/log';
import { Response } from 'express';
import { APIGuild, RESTPostOAuth2AccessTokenResult, Routes } from 'discord.js';
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
    log.error("failed to fetch client ID, defaulting to fallback ID. Error:", err);
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

// user cache to reduce Discord API calls
interface CachedUser {
    user: APIUser | OAuth2Error;
    timestamp: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function getUser(token: string): Promise<APIUser | OAuth2Error | undefined> {
    if (!token) {
        return;
    }
    try {
        // check if user is in cache and not expired
        const cached = userCache.get(token);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            log.debug(`returning cached user for token ${token.substring(0, 8)}...`);
            return cached.user;
        }

        // fetch from Discord API
        log.debug(`fetching user from Discord API for token ${token.substring(0, 8)}...`);
        const user = await fetch(discordApi + Routes.user('@me'), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(res => res.json() as Promise<APIUser>);

        // cache the result
        userCache.set(token, {
            user,
            timestamp: Date.now()
        });

        // clean up old cache entries periodically (keep cache size reasonable)
        if (userCache.size > 100) {
            const now = Date.now();
            for (const [cacheToken, cached] of userCache.entries()) {
                if (now - cached.timestamp > CACHE_DURATION) {
                    userCache.delete(cacheToken);
                }
            }
        }

        return user;
    } catch (err) {
        log.error(err);
        return;
    }
}

// guilds cache to reduce Discord API calls
interface CachedGuilds {
    guilds: APIGuild[] | OAuth2Error;
    timestamp: number;
}

const guildsCache = new Map<string, CachedGuilds>();

export async function fetchGuilds(token: string): Promise<APIGuild[] | OAuth2Error | undefined> {
    if (!token) {
        return;
    }
    try {
        // check if guilds are in cache and not expired
        const cached = guildsCache.get(token);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            log.debug(`returning cached guilds for token ${token.substring(0, 8)}...`);
            return cached.guilds;
        }

        // fetch from Discord API
        log.debug(`fetching guilds from Discord API for token ${token.substring(0, 8)}...`);
        const guilds = await fetch(discordApi + Routes.userGuilds(), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(res => res.json() as Promise<APIGuild[]>);

        // cache the result
        guildsCache.set(token, {
            guilds,
            timestamp: Date.now()
        });

        // clean up old cache entries periodically
        if (guildsCache.size > 100) {
            const now = Date.now();
            for (const [cacheToken, cached] of guildsCache.entries()) {
                if (now - cached.timestamp > CACHE_DURATION) {
                    guildsCache.delete(cacheToken);
                }
            }
        }

        return guilds;
    } catch (err) {
        log.error(err);
        return;
    }
}