import express from "express";
import fs from "fs";
import prettyBytes from "pretty-bytes";
import path from "node:path";
import { stat } from "fs/promises";
import rateLimit from "express-rate-limit";
import * as log from "./lib/log.js";
import process from "node:process";

const blockedIps = {
    "173.12.11.240": "you're the reason i had to add a rate limiter.",
    "36.139.5.209": "cease your request spamming.",
    "150.213.157.212":
        "im sorry mr switzerlander but too many requests from some rando i don't know results in blocking!",
    "209.126.106.7": "i don't got those pages open man stop trying",
};

let requestCount = fs.readFileSync("resources/data/requestCount.txt", "utf-8");
requestCount = parseInt(requestCount);

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

const starts = {};

const app = express();
const siteStartedAt = Date.now();
const startedAtDate = new Date(siteStartedAt);
const humanReadableDate = startedAtDate.toLocaleString();

starts.site = {
    startedAt: humanReadableDate,
    startedAtTimestamp: siteStartedAt,
};

function kill() {
    log.info("kill called, killing site host");
    process.exit(0);
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
    requestCount++;
    const stringRequestCount = requestCount.toString();
    fs.writeFile(
        "resources/data/requestCount.txt",
        stringRequestCount,
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
app.use(express.static(path.join(rootPath, "pages")));
app.use((err, req, res, next) => {
    log.error(err.stack);
    res.status(500).send("problem? yeah :/");
});

const pages = fs.readdirSync(`${rootPath}/pages`);
for (const page of pages) {
    const pageName = page.split(".")[0];
    app.get(`/${pageName}`, (req, res) => {
        res.sendFile(`pages/${page}`, { root: rootPath });
    });
}

app.get("/", (request, response) => {
    logAccess(request);
    return response.sendFile(`${rootPath}/index.html`, { root: rootPath });
});

let shardCount = 0;

app.get("/read-statistics", (req, res) => {
    fs.readFile(
        "./resources/data/statistics.json",
        "utf8",
        async (err, data) => {
            if (err) {
                log.error(err);
                return res.status(500).send("Error reading file");
            }
            const memory = process.memoryUsage();
            const updates = fs.readdirSync("./resources/data/updates");
            const latestUpdate = updates.length + 1;
            const object = {
                version: latestUpdate,
                mem: `${prettyBytes(memory.rss)} memory usage, ${prettyBytes(
                    memory.heapUsed
                )} / ${prettyBytes(memory.heapTotal)} heap usage`,
                wasted_space: prettyBytes(
                    await dirSize("./resources/ytdl_cache/")
                ),
                system: `${process.platform} ${process.arch}`,
                starts: {
                    site: {
                        startedAt: humanReadableDate,
                        startedAtTimestamp: siteStartedAt,
                    },
                    bot: {
                        startedAt: starts.bot.startedAt,
                        startedAtTimestamp: starts.bot.startedAtTimestamp,
                    },
                    shard: {
                        startedAt: starts.shard.startedAt,
                        startedAtTimestamp: starts.shard.startedAtTimestamp,
                    },
                },
                usage: JSON.parse(data),
                shardCount: shardCount,
                requestCount: requestCount,
            };
            res.send(object);
        }
    );
});

app.get("/test", (req, res) => {
    res.send(`${req.ip} test recieved`);
});

const ipv4regex =
    /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g;

app.get("/read-log", (req, res) => {
    const logType = req.query.level;
    const pretty = req.query.pretty;
    const logPath = `./logs/${logType}.log`;
    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).send(`log "${logType}" not found`);
        }
        const logContent = fs.readFileSync(logPath, "utf8");
        if (pretty) {
            return res.send(logContent.replace(/\n/g, "<br>"));
        }
        if (logType == "access") {
            const matches = logContent.match(ipv4regex);
            if (matches) {
                const truncatedLogContent = logContent.replace(
                    ipv4regex,
                    (match) => {
                        const parts = match.split(".");
                        return `${parts[0]}.${parts[1].slice(0, 1)}...`;
                    }
                );
                res.send(truncatedLogContent);
                return;
            }
        }
        res.send(logContent);
    } catch (err) {
        log.error(err);
        return res.status(500).send("error reading log");
    }
});

app.get("/read-update", (req, res) => {
    const logType = req.query.version;
    const pretty = req.query.pretty;
    const logPath = `./resources/data/updates/${logType}.txt`;
    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).send(`update "${logType}" not found`);
        }
        const logContent = fs.readFileSync(logPath, "utf8");
        if (pretty) {
            return res.send(logContent.replace(/\n/g, "<br>"));
        }
        res.send(logContent);
    } catch (err) {
        log.error(err);
        return res.status(500).send("error reading update");
    }
});

app.get("/get-latest-update", (req, res) => {
    const updates = fs.readdirSync("./resources/data/updates");
    const latestUpdate = updates.length;
    res.send(String(latestUpdate));
});

app.get("/read-todo", (req, res) => {
    const path = `./resources/data/todos/440163494529073152/pepperbot_dev.json`;
    try {
        if (!fs.existsSync(path)) {
            return res.status(404).send(`todo not found`);
        }
        const logContent = fs.readFileSync(path, "utf8");
        res.send(logContent);
    } catch (err) {
        log.error(err);
        return res.status(500).send("error reading todo");
    }
});

app.use("/cgi-bin", (req, res, next) => {
    res.redirect("http://plaskinino.horse");
});

app.all("*", (req, res) => {
    res.sendFile(`pages/errors/404.html`, {
        root: rootPath,
    });
}); // MAKE SURE THIS IS THE LAST ONE DEFINED

export function setShardCount(count) {
    shardCount = count;
    return shardCount;
}

setTimeout(() => {
    try {
        app.listen(53134, "0.0.0.0", () =>
            log.info(`site listening at http://localhost:53134`)
        );
        process.send({ action: "ready" });
    } catch (err) {
        log.fatal(`unable to listen to port: ${err}`);
    }
}, 2000); // this is needed because if i restart this process it will error because the port hasn't been cleared yet

process.on("message", (message) => {
    if (message.action === "setShardCount") {
        setShardCount(message.value);
        return;
    }
    if (message.action === "kill") {
        kill();
        return;
    }
    if (message.action === "updateStartedAt") {
        starts.bot = message.bot;
        starts.shard = message.shard;
        log.info("updated started at times");
        return;
    }
});

process.on("uncaughtException", (err) => {
    throw new Error(err);
});
