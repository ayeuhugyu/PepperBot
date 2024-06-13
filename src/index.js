import dotenv from "dotenv";
dotenv.config();
import { ShardingManager } from "discord.js";
import * as log from "./lib/log.js";
import process from "node:process"
import express from "express";
import fs from "fs"

const app = express();
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const webRootPath = "./src/WebServer";

const rootPath = "./src/WebServer";

app.use(express.static(rootPath));

app.get("/", (request, response) => {
    log.debug("GET /")
    return response.sendFile(`${rootPath}/index.html`, { root: rootPath });
});

app.listen(config.WebServer.port, () =>
    log.info(`app listening at http://localhost:${config.WebServer.port} (@home network = http://192.168.4.31:${config.WebServer.port})`)
);

app.use((err, req, res, next) => {
    log.error(err.stack);
    res.status(500).send('Something broke!');
});

app.get('/read-statistics-file', (req, res) => {
    fs.readFile('./resources/data/statistics.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading file');
        }
        res.send(data);
    });
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