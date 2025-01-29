import express from "express";
import bodyParser from "body-parser";
import * as log from "./log"

let servers: {[key: string]: express.Application} = {};

export async function startServer(id: string, port: number) {
    if (servers[id]) {
        return new Error(`server "${id}" is already running.`);
    }

    try {
        const app = express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.listen(port, () => {
            log.info(`started "${id}" server on port ${port}`);
        });
        servers[id] = app;
    } catch (e: any) {
        return new Error(`server "${id}" failed to start: ${e.message}`);
    }
    return servers[id];
}