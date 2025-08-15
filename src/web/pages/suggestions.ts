import { Router, Request, Response, NextFunction } from "express";
import { Client, GuildTextBasedChannel, MessageCreateOptions, MessagePayload } from "discord.js";
import { getUser } from "../oauth2";
import * as log from "../../lib/log";
import { textToAttachment } from "../../lib/attachment_manager";

const channelId = "1405585167086780436";

export function createSuggestionsRoutes(client: Client): Router {
    const router = Router();

    // GET route - display the suggestions form
    router.get("/suggestions", async (req: Request, res: Response, next: NextFunction) => {
        try {
            let user = null;
            let isAuthenticated = false;

            // Check if user is authenticated (using the correct cookie name)
            if (req.cookies.LIBERAL_LIES) {
                const userData = await getUser(req.cookies.LIBERAL_LIES);
                if (userData && typeof userData === "object" && "id" in userData) {
                    user = userData;
                    isAuthenticated = true;
                }
            }

            res.render("suggestions", {
                title: "suggestions",
                description: "Submit suggestions for PepperBot",
                path: "/suggestions",
                stylesheet: "suggestions.css",
                user,
                isAuthenticated
            });
        } catch (err) {
            log.error("Error in suggestions GET route:", err);
            next(err);
        }
    });

    // POST route - handle suggestion submission
    router.post("/suggestions", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { suggestion, anonymous } = req.body;

            if (!suggestion || typeof suggestion !== 'string' || suggestion.trim().length === 0) {
                res.status(400).json({
                    error: "Suggestion text is required and cannot be empty"
                });
                return;
            }

            if (suggestion.trim().length > 2000) {
                res.status(400).json({
                    error: "Suggestion text cannot exceed 2000 characters"
                });
                return;
            }

            let user = null;
            let userMention = "anonymous user";

            // Check if user is authenticated (using the correct cookie name)
            if (req.cookies.LIBERAL_LIES) {
                const userData = await getUser(req.cookies.LIBERAL_LIES);
                if (userData && typeof userData === "object" && "id" in userData) {
                    user = userData;

                    // If not submitting anonymously, include user info
                    if (!anonymous || anonymous !== 'true') {
                        userMention = `<@${user.id}> (${user.username})`;
                    }
                }
            }

            // get channel to send suggestions to
            const targetChannel = await client.channels.fetch(channelId);
            if (!targetChannel) {
                log.error("Could not find target user for suggestions");
                res.status(500).json({
                    error: "could not send suggestion"
                });
                return;
            }

            // Prepare the message
            let messageContent = `**new suggestion**\n**from:** ${userMention}`;
            let message: MessageCreateOptions = {
                content: messageContent,
                files: [textToAttachment(suggestion.trim(), "suggestion.txt")]
            };

            // Send DM using .then and .catch
            (targetChannel as GuildTextBasedChannel).send(message)
                .then(() => {
                    log.info(`suggestion sent to ${channelId} from ${!anonymous ? user?.id : 'anonymous'}`);

                    res.json({
                        success: true,
                        message: "suggestion submitted successfully"
                    });
                })
                .catch((dmError) => {
                    log.error("failed to send DM:", dmError);
                    res.status(500).json({
                        error: "failed to send suggestion - please try again later"
                    });
                });
        } catch (err) {
            log.error("error in suggestions POST route:", err);
            next(err);
        }
    });

    return router;
}
