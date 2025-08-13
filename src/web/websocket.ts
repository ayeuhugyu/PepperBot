import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import GlobalEvents from "../lib/communication_manager";
import * as log from "../lib/log";
import { getUser } from "./oauth2";
import { CommandAccessTemplates } from "../lib/templates";

// WebSocket clients tracking
interface LogClient {
    ws: WebSocket;
    level: string;
    isWhitelisted: boolean;
}

const logClients: Set<LogClient> = new Set();
const whitelist = CommandAccessTemplates.dev_only.whitelist.users;
const whitelistOnlyLevels = ['debug', 'access'];

export function initializeWebSocket(server: Server) {
    const wss = new WebSocketServer({ server });

    // WebSocket connection handler
    wss.on('connection', (ws) => {
        log.debug('websocket client connected');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (data.type === 'subscribe') {
                    // Remove any existing clients for this WebSocket first
                    for (const client of logClients) {
                        if (client.ws === ws) {
                            logClients.delete(client);
                        }
                    }

                    // Check if user is whitelisted for protected levels
                    let isWhitelisted = false;
                    if (data.cookies && data.cookies.LIBERAL_LIES) {
                        try {
                            const user = await getUser(data.cookies.LIBERAL_LIES);
                            if (user && typeof user === "object" && "id" in user && whitelist.includes(user.id ?? "")) {
                                isWhitelisted = true;
                            }
                        } catch (error) {
                            log.error("error checking user whitelist:", error);
                        }
                    }

                    // Add client to tracking
                    const logClient: LogClient = {
                        ws,
                        level: data.level || 'global',
                        isWhitelisted
                    };
                    logClients.add(logClient);

                    // Send confirmation
                    ws.send(JSON.stringify({
                        type: 'subscribed',
                        level: logClient.level,
                        isWhitelisted: logClient.isWhitelisted
                    }));

                    log.debug(`websocket client subscribed to ${logClient.level} logs (whitelisted: ${logClient.isWhitelisted})`);
                } else if (data.type === 'unsubscribe') {
                    // Remove client from tracking
                    for (const client of logClients) {
                        if (client.ws === ws) {
                            logClients.delete(client);
                            log.debug('webSocket client unsubscribed');
                            break;
                        }
                    }
                }
            } catch (error) {
                log.error('websocket message error:', error);
            }
        });

        ws.on('close', () => {
            // Remove client from tracking
            for (const client of logClients) {
                if (client.ws === ws) {
                    logClients.delete(client);
                    break;
                }
            }
            log.debug('websocket client disconnected');
        });

        ws.on('error', (error) => {
            log.error('websocket error:', error);
        });
    });

    // Listen for log events and broadcast to websocket clients
    GlobalEvents.on("log", (fileString: string, level: log.Level) => {
        const levelName = log.Level[level].toLowerCase();

        // Broadcast to subscribed clients
        for (const client of logClients) {
            // Check if client is subscribed to this level or global
            const isSubscribedLevel = client.level === levelName ||
                                    (client.level === 'global' && !whitelistOnlyLevels.includes(levelName));

            // Check whitelist permissions for protected levels
            const canAccessLevel = !whitelistOnlyLevels.includes(levelName) || client.isWhitelisted;

            if (isSubscribedLevel && canAccessLevel && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                    type: 'newLog',
                    level: levelName,
                    data: fileString.trim()
                }));
            }
        }
    });

    log.info('websocket server initialized');
    return wss;
}
