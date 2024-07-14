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
import { spawn } from "node:child_process";
import rateLimit from "express-rate-limit";

const blockedIps = {
    "173.12.11.240": "you're the reason i had to add a rate limiter.",
    "36.139.5.209": "cease your request spamming.",
};

const logRateLimit = (() => {
    const ipLogTimes = {};
    const logInterval = 120000;

    return (ip) => {
        const now = Date.now();
        if (!ipLogTimes[ip] || now - ipLogTimes[ip] > logInterval) {
            log.warn(`rate limit exceeded for ${ip}`);
            ipLogTimes[ip] = now;
        }
    };
})();

const limiter = rateLimit({
    windowMs: 2000,
    max: 50,
    handler: (req, res, next, options) => {
        logRateLimit(req.ip);
        req.socket.destroy(); // Note that this approach is quite aggressive. - Github Copilot
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const app = express();
const startedAt = Date.now();
const date = new Date(startedAt);
const humanReadableDate = date.toLocaleString();
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

function kill() {
    log.info("kill called, killing host");
    process.exit();
}

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
    fs.readFileSync("resources/data/persistent_data.json", "utf-8")
);
const rootPath = "./src/WebServer";

async function logAccess(req) {
    const currentDate = new Date();
    const formattedDate = `${(currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${currentDate
        .getDate()
        .toString()
        .padStart(2, "0")} ${currentDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${currentDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${currentDate
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    fs.appendFile(
        "logs/access.log",
        `${formattedDate} ACCESS FROM ${req.ip} AT ${req.path}\n`,
        () => {}
    );
}

app.use((req, res, next) => {
    if (blockedIps[req.ip]) {
        return res.send(blockedIps[req.ip]);
    }
    next();
});
app.use(limiter);
app.use((req, res, next) => {
    logAccess(req);
    next();
});
app.use(express.static(rootPath));

app.get("/", (request, response) => {
    logAccess(request);
    return response.sendFile(`${rootPath}/index.html`, { root: rootPath });
});

setTimeout(() => {
    try {
        app.listen(53134, "0.0.0.0", () =>
            log.info(`site listening at http://localhost:53134`)
        );
    } catch (err) {
        log.fatal(`unable to listen to port: ${err}`);
    }
}, 2000); // this is needed because if i restart this process it will error because the port hasn't been cleared yet

app.use((err, req, res, next) => {
    log.error(err.stack);
    res.status(500).send("Something broke!");
});

let shardCount = 0;

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
                startedAt: humanReadableDate,
                startedAtTimestamp: startedAt,
                usage: JSON.parse(data),
                shardCount: shardCount,
            };
            res.send(object);
        }
    );
});

app.get("/read-log", (req, res) => {
    const logType = req.query.level;
    const logPath = `./logs/${logType}.log`;
    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).send(`log "${logType}" not found`);
        }
        const logContent = fs.readFileSync(logPath, "utf8");
        res.send(logContent);
    } catch (err) {
        log.error(err);
        return res.status(500).send("error reading log");
    }
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
            shardCount++;
            shard.on("message", (message) => {
                if (message == "kill") {
                    kill();
                }
                return message._result;
            });
        });
    })
    .catch(log.error);

export default manager;
