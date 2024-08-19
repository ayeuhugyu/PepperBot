import process from "node:process";
import { fork } from "child_process";
import * as log from "./lib/log.js";

log.info("forking processes..");

function handleSiteRequests(message) {}
function handleSharderRequests(message) {
    if (message.action && message.action == "updateStartedAt") {
        site.send({
            action: "updateStartedAt",
            bot: message.times.bot,
            shard: message.times.shard,
        });
    }
    if (message.action && message.action == "setShardCount") {
        site.send({ action: "setShardCount", value: message.value });
    }
    if (message.action && message.action == "restart") {
        if (message.process) {
            if (message.process == "site") {
                forkSite();
            }
            if (message.process == "sharder") {
                forkSharder();
            }
        }
    }
}

let sharder;
function forkSharder() {
    if (sharder) {
        sharder.send({ action: "kill" });
    }
    log.info("forking sharder.js");
    sharder = fork("src/sharder.js");
    log.info("finished forking sharder.js");
    sharder.on("message", (message) => {
        return handleSharderRequests(message);
    });
    sharder.on("error", (err) => {
        log.fatal(`FATAL SHARDER ERROR: \n\n${err}${err.stack ? `\n${err.stack}` : ''}\n\n REFORKING...`);
        forkSharder();
    });
    sharder.on("exit", (code, signal) => {
        if (code !== 0) {
            log.fatal(
                `SHARDER EXITED WITH CODE ${code} AND SIGNAL ${signal}\n\n REFORKING...`
            );
            forkSharder();
        }
    });
    sharder.once("message", (message) => {
        if (message.action && message.action == "ready") {
            log.info("sharder ready");
        }
    });
}

let site;
function forkSite() {
    if (site) {
        site.send({ action: "kill" });
    }
    log.info("forking site.js");
    site = fork("src/site.js");
    log.info("finished forking site.js");
    site.on("message", (message) => {
        return handleSiteRequests(message);
    });
    site.on("error", (err) => {
        log.fatal(`FATAL SHARDER ERROR: \n\n${err}${err.stack ? `\n${err.stack}` : ''}\n\n REFORKING...`);
        forkSharder();
    });
    site.on("exit", (code, signal) => {
        if (code !== 0) {
            log.fatal(
                `SHARDER EXITED WITH CODE ${code} AND SIGNAL ${signal}\n\n REFORKING...`
            );
            forkSharder();
        }
    });
    site.once("message", (message) => {
        if (message.action && message.action == "ready") {
            log.info("site ready");
            if (!sharder) {
                forkSharder();
            } else {
                sharder.send({ action: "forceUpdateTimes" });
            }
        }
    });
}
await forkSite();
