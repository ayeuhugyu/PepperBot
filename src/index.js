import dotenv from "dotenv";
dotenv.config();
import { ShardingManager } from "discord.js";
import * as log from "./lib/log.js";
import process from "node:process";
import express from "express";
import fs from "fs";
import prettyBytes from "pretty-bytes";
import path from "node:path";
import { stat } from "fs/promises";

const app = express();
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const webRootPath = "./src/WebServer";

const dirSize = async (directory) => {
    let files = fs.readdirSync(directory);
    files = files.map((file) => path.join(directory, file));
    const logs = fs.readdirSync("logs");
    for (const log of logs) {
        if (log.endsWith(".log") && !(log == "messages.log")) {
            files.push("logs/" + log);
        }
    } // lmao i just pasted this in here idec that its not valid for its function fuck you
    const stats = files.map((file) => stat(file));

    return (await Promise.all(stats)).reduce(
        (accumulator, { size }) => accumulator + size,
        0
    );
};

const persistent_data = JSON.parse(
    fs.readFileSync(config.paths.persistent_data_file, "utf-8")
);
const rootPath = "./src/WebServer";

app.use(express.static(rootPath));

app.get("/", (request, response) => {
    log.debug("GET /");
    return response.sendFile(`${rootPath}/index.html`, { root: rootPath });
});

app.listen(config.WebServer.port, "0.0.0.0", () =>
    log.info(
        `app listening at http://localhost:${config.WebServer.port}`
    )
);

app.use((err, req, res, next) => {
    log.error(err.stack);
    res.status(500).send("Something broke!");
});

app.get("/read-statistics", (req, res) => {
    fs.readFile(
        "./resources/data/statistics.json",
        "utf8",
        async (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error reading file");
            }
            const memory = process.memoryUsage();
            const object = {
                version: persistent_data.version,
                mem: `${prettyBytes(memory.rss)} memory usage, ${prettyBytes(
                    memory.heapUsed
                )} / ${prettyBytes(memory.heapTotal)} heap usage`,
                wasted_space: prettyBytes(
                    await dirSize("./resources/ytdl_cache/")
                ),
                system: `${process.platform} ${process.arch}`,
                usage: JSON.parse(data),
            };
            res.send(object);
        }
    );
});

app.get("/read-logs", (req, res) => {
    const object = {};
    const errors = fs.readFileSync("./logs/error.log", "utf8");
    const warns = fs.readFileSync("./logs/warn.log", "utf8");
    const info = fs.readFileSync("./logs/info.log", "utf8");
    const dbg = fs.readFileSync("./logs/debug.log", "utf8");
    object.errors = errors;
    object.warns = warns;
    object.info = info;
    object.debug = dbg;
    res.send(object);
});

log.debug("starting pepperbot");

const manager = new ShardingManager("src/bot.js", {
    token: process.env.DISCORD_TOKEN,
    totalShards: "auto",
});

manager.on("shardCreate", (shard) =>
    log.debug(`launched pepperbot shard ${shard.id}`)
);

manager
    .spawn()
    .then((shards) => {
        shards.forEach((shard) => {
            shard.on("message", (message) => {
                //log.info(
                //`Shard[${shard.id}] : ${message._eval} : ${message._result}`
                //);
                return message._result;
            });
        });
    })
    .catch(log.error);

export default manager;
