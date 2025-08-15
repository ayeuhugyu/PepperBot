import { Router, Request, Response, NextFunction } from "express";
import { getRefreshToken, getToken, getUser, oauth2Url, updateCookies } from "../oauth2";
import * as log from "../../lib/log";

export function createAuthRoutes(): Router {
    const router = Router();

    router.get("/auth", async (req: Request, res: Response, next: NextFunction) => {
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
            else {
                log.debug("Error getting token:", token.error, token.error_description);
                return next(new Error(token.error));
            }
        } else {
            updateCookies(res, token.access_token, token.refresh_token);
            return res.redirect('/'); // todo: implement redirect system
        }
    });

    return router;
}
