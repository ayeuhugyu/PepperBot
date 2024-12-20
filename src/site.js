import { config } from "dotenv";
config();
import express from "express";
import fs from "fs";
import prettyBytes from "pretty-bytes";
import path from "node:path";
import { stat } from "fs/promises";
import * as log from "./lib/log.js";
import * as files from "./lib/files.js"
import process from "node:process";
import commonRegex from "./lib/commonRegex.js";
import url from "url";
import https from "https";
import http from "http";
import { Server } from "socket.io";
import * as chat from "./lib/webchat.js"
import statistics from "./lib/statistics.js";

const blockedIps = {
    "173.12.11.240": "you're the reason i had to add a rate limiter.",
    "36.139.5.209": "cease your request spamming.",
    "150.213.157.212":
        "im sorry mr switzerlander but too many requests from some rando i don't know results in blocking!",
    "209.126.106.7": "i don't got those pages open man stop trying",
};

const pageAliases = {
    "pepperbot": "guide"
}

const starts = {};

const app = express();

const httpServer = http.createServer(app);
let httpsServer
if (process.env.IS_DEV !== "True") {
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/pepperbot.online/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/pepperbot.online/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/pepperbot.online/chain.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate, ca: ca };
    httpsServer = https.createServer(credentials, app);
}

let io
if (process.env.IS_DEV == "True") {
    console.log("using http for socket.io");
    io = new Server(httpServer)
} else {
    io = new Server(httpsServer)
}

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

const rootPath = "./src/site";

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
        `${formattedDate} ACCESS FROM ${req.headers['cf-connecting-ip'] || req.ip} AT ${req.path}\n`,
        () => {}
    );
    statistics.addRequestCountStat()
}

io.on("connection", (socket) => {
    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });
    socket.on("typing", (user, stop) => {
        const processedUser = chat.getUser(user);
        const cloneOfProcessedUser = JSON.parse(JSON.stringify(processedUser));
        delete cloneOfProcessedUser.id;
        io.emit("typing", cloneOfProcessedUser);
    })
});

app.use((req, res, next) => {
    if (blockedIps[req.ip]) {
        return res.send(blockedIps[req.ip]);
    }
    next();
});
const dontAllowHostlessRequests = true;
app.use((req, res, next) => {
    if ((!req.headers.host || (!req.headers.host.startsWith("pepperbot.online")) && !req.headers.host.startsWith("localhost") && !req.headers.host === "192.168.4.31") && dontAllowHostlessRequests) {
        res.status(400).send("Invalid host header; Please use https://pepperbot.online");
        return;
    }
    next();
});
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

let pages = fs.readdirSync(`${rootPath}/pages`);
let simulations = fs.readdirSync(`${rootPath}/pages/sims`);
simulations = simulations.map((simulation) => `sims/${simulation}`);
pages = pages.concat(simulations);
for (const page of pages) {
    const pageName = page.split(".")[0];
    app.get(`/${pageName}`, (req, res) => {
        res.sendFile(`pages/${page}`, { root: rootPath });
    });
}
for (const alias in pageAliases) {
    console.log('setting alias: ' + alias + ' to ' + pageAliases[alias]);
    app.get(`/${alias}`, (req, res) => {
        console.log("getting alias: " + alias);
        res.redirect(`/${pageAliases[alias]}`);
    });
}

app.get("/", (request, response) => {
    logAccess(request);
    return response.sendFile(`${rootPath}/index.html`, { root: rootPath });
});

let shardCount = 0;

app.get("/api/chat/messages", (req, res) => { // get 20 messages above a message id
    const id = req.query.id;
    if (!id) {
        return res.status(400).send("no id provided");
    }
    const messages = chat.getMessagesAbove(id, 20);
    if (messages.length <= 0) {
        return res.status(404).send("no messages found");
    }
    res.send(messages);
});

app.get("/api/chat/message", (req, res) => { // get a message by id
    const id = req.query.id;
    if (!id) {
        return res.status(400).send("no message id provided");
    }
    const message = chat.getMessage(id);
    if (!message) {
        return res.status(404).send("message not found");
    }
    const cloneOfMessage = JSON.parse(JSON.stringify(message));
    delete cloneOfMessage.author.id;
    res.send(cloneOfMessage);
});

app.get("/api/chat/user", (req, res) => { // get a user by id
    const id = req.query.id;
    if (!id) {
        return res.status(400).send("no user id provided");
    }
    const user = chat.getUser(id);
    if (!user) {
        return res.status(404).send("user not found");
    }
    res.send(user);
});

app.post("/api/chat/user", (req, res) => { // post a user
    const username = req.query.username.slice(0, 64).trim();
    if (!username) {
        return res.status(400).send("no username provided");
    }
    const id = chat.registerUser(username, { bot: false, system: false, error: false }, username);
    res.send(JSON.stringify(chat.getUser(id)));
});

app.post("/api/chat/message", (req, res) => { // post a message
    if (!req.query.text) {
        return res.status(400).send("no text provided");
    }
    if (!req.query.author) {
        return res.status(400).send("no author provided");
    }
    const text = req.query.text.slice(0, 2048).trim();
    const author = req.query.author;
    if (!text || !author) {
        return res.status(400).send("missing parameters");
    }
    const user = chat.getUser(author);
    if (!user) {
        return res.status(400).send(`user ${author} not found`);
    }
    const id = chat.postMessage(text, author);
    const webSpoofMessage = new chat.WebSpoofMessage(text, author);
    try {
        process.send({ action: "messageCreate", message: webSpoofMessage });
    } catch (err) {
        log.error(err);
    }
    const message = chat.getMessage(id);
    const cloneOfMessage = JSON.parse(JSON.stringify(message));
    delete cloneOfMessage.author.id;
    io.emit("chat message", cloneOfMessage);
    res.send(id);
});

app.get("/api/chat/latest", (req, res) => { // get the latest messages
    const messages = chat.getLatestMessages(150);
    const cloneOfMessages = messages.map((message) => {
        const cloneOfMessage = JSON.parse(JSON.stringify(message));
        delete cloneOfMessage.author.id;
        return cloneOfMessage;
    });
    res.send(cloneOfMessages);
});

app.get("/api/read-statistics", (req, res) => {
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
                },
                statistics: JSON.parse(data),
                shardCount: shardCount,
            };
            if (starts.bot) {
                object.starts.bot = starts.bot;
            }
            if (starts.shard) {
                object.starts.shard = starts.shard;
            }
            res.send(object);
        }
    );
});

app.get("/test", (req, res) => {
    res.send(`${req.ip} test recieved`);
});

const ipv4regex = commonRegex.ipv4regex

app.get("/api/read-log", (req, res) => {
    const logType = req.query.level;
    const pretty = req.query.pretty || false;
    const startIndex = req.query.start || 0;
    const endIndex = req.query.end || startIndex + 250;
    if (endIndex - startIndex > 250) {
        return res.status(400).send("too many lines requested");
    }
    if (endIndex < startIndex) {
        return res.status(400).send("end index is less than start index");
    }
    const sanitizedLogType = logType.split("..").join("");
    const logPath = `./logs/${sanitizedLogType}.log`;
    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).send(`log "${sanitizedLogType}" not found`);
        }
        const logContent = files.readLinesBetween(logPath, startIndex, endIndex, (err, logContent) => {
            if (err) {
                log.error(err);
                return res.status(500).send("error reading log");
            }
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
        });
    } catch (err) {
        log.error(err);
        return res.status(500).send("error reading log");
    }
});

app.get("/api/get-log-length", (req, res) => {
    const logType = req.query.level;
    const logPath = `./logs/${logType}.log`;
    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).send(`log "${logType}" not found`);
        }
        const logLength = files.getFileLength(logPath, (err, logLength) => {
            if (err) {
                log.error(err);
                return res.status(500).send("error reading log");
            }
            res.send(String(logLength));
        });
    } catch (err) {
        log.error(err);
        return res.status(500).send("error reading log");
    }
});

app.get("/api/read-update", (req, res) => {
    const logType = req.query.version;
    const pretty = req.query.pretty;
    const sanitizedLogType = logType.split("..").join("");
    const logPath = `./resources/data/updates/${sanitizedLogType}.txt`;
    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).send(`update "${sanitizedLogType}" not found`);
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

app.get("/api/get-latest-update", (req, res) => {
    const updates = fs.readdirSync("./resources/data/updates");
    const latestUpdate = updates.length;
    res.send(String(latestUpdate));
});

app.get("/api/read-todo", (req, res) => {
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

app.get(`/oauth2/login`, async (req, res) => {
    const code = req.query.code;
    if (!code) {
        //return res.redirect("/error?error=400 Bad Request; OAuth2 code not provided");
        return res.status(400).send("no code provided");
    }
    const data = new url.URLSearchParams({
        'client_id': process.env.DISCORD_OAUTH_CLIENT_ID,
        'client_secret': process.env.DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': (process.env.IS_DEV == 'True') ? 'http://localhost:53134/oauth2/login' : 'https://pepperbot.online/oauth2/login',
        'scope': 'identify',
    });
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': process.env.DISCORD_TOKEN,
    };
    const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
        method: 'POST',
        body: data.toString(),
        headers: headers,
    });
    const output = await response.json();
    if (output.error) {
        //return res.redirect(`/error?error=500 Internal Server Error; ${output.error}; ${output.error_description}`);
        return res.status(500).send(`500: ${output.error}; ${output.error_description}`);
    } else {
        res.redirect(`/oauth2success?token=${output.access_token}&refreshToken=${output.refresh_token}&expires=${output.expires_in}`);
    }
})

app.get(`/oauth2/getUserInfo`, async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).send("no oauth2 token provided");
    }
    const userinfoNonJSON = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const userinfo = await userinfoNonJSON.json();
    res.send(userinfo);
});

app.get(`/oauth2/getGuilds`, async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).send("no oauth2 token provided");
    }
    const guildsNonJSON = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const guilds = await guildsNonJSON.json();
    res.send(guilds);
});

app.use("/cgi-bin", (req, res, next) => {
    res.redirect("http://plaskinino.horse");
});
app.use("/sludge", (req, res, next) => {
    res.redirect("http://sludge.de");
});

app.all("*", (req, res) => {
    res.sendFile("/pages/errors/404.html", { root: rootPath });
}); // MAKE SURE THIS IS THE LAST ONE DEFINED

export function setShardCount(count) {
    shardCount = count;
    return shardCount;
}

setTimeout(() => {
    try {
        if (process.env.IS_DEV == "True") {
            console.log("dev environment detected");
            httpServer.listen(53134);
            log.info(`site listening at http://localhost:53134`)
        } else {
            httpServer.listen(53134);
            httpsServer.listen(443);
            log.info(`site listening at http://localhost:53134 & https://localhost:443`);
        }
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
        log.debug("updated started at times");
        return;
    }
    if (message.action == "log") {
        const level = message.level;
        const log = message.log;
        const time = message.time;
        io.emit("log", { level: level, log: log, time: time });
        console.log(`log recieved by site: ${time} ${level.toUpperCase()} ${log}`);
    }
});

process.on("uncaughtException", (err) => {
    throw new Error(err);
});
