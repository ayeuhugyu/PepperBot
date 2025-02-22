import * as log from "./lib/log";
import { fork, ChildProcess } from "node:child_process";
import { startServer as startCommunicationServer } from "./lib/communication_manager";

log.info("starting bot...");
process.on("warning", log.warn);
let sharder: ChildProcess;
let web: ChildProcess;

async function forkSharder() {
    return new Promise(async (resolve) => {
        log.info("forking sharder.ts...");
        if (sharder) {
            log.info("killing old sharder...");
            sharder.kill();
        }
        sharder = await fork("./src/sharder.js");
        log.info("forked sharder.ts");
        sharder.on("exit", (code) => {
            log.fatal(`[PEPPERCRITICAL] sharder exited with code ${code}, restarting in 5 minutes...`);
            setTimeout(forkSharder, 300000);
        });

        sharder.on("message", (msg) => { // this is the only time i will ever use this Horrendous System
            if (msg === "ready") resolve(true);
        });
    })
}

async function forkWeb() {
    log.info("forking web interface...");
    // TODO: find a different location
    if (web) {
        log.info("killing old web interface...");
        web.kill();
    }
    web = await fork("./src/web/index.ts");
    log.info("forked web interface");
    web.on("exit", (code) => {
        log.fatal(`[PEPPERCRITICAL] web interface exited with code ${code}, restarting in 5 minutes...`);
        setTimeout(forkWeb, 300000);
    });

    web.on("message", (msg) => {
        if (msg === "ready") log.info("web interface ready");
    });
}

const app = await startCommunicationServer("main", 50000);
if (app instanceof Error) {
    log.error(app.message);
    process.exit(1);
}
app.get("/kill", (req, res) => {
    log.warn("kill request received, shutting down...");
    res.sendStatus(200).send("shutting down...");
    process.exit(0);
});
app.post("/restart", async (req, res) => {
    const processName = req.body.process;
    log.info(`restarting ${processName}...`);
    switch (processName) {
        case "sharder":
            await forkSharder();
            break;
        default:
            log.warn(`unknown process ${processName}`);
            break;
    }
    res.sendStatus(200).send(`restarted ${processName}`);
});
let hasVerified = false;
app.get("/verified", (req, res) => { // really messed up way to avoid verifying multiple times (just makes the logs cleaner)
    res.send(hasVerified);
})
const database = await import("./lib/data_manager"); // we dont actually need to run verifyData because the script will do that itself
database.default.destroy();
hasVerified = true;

await forkSharder();
await forkWeb();