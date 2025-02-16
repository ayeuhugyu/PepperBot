import * as log from "./lib/log";
import { fork, ChildProcess } from "node:child_process";
import { startServer as startCommunicationServer } from "./lib/communication_manager";
import { startServer as startWebServer } from "./web";

log.info("starting bot...");
let sharder: ChildProcess;

async function forkSharder() {
    log.info("forking sharder.ts...");
    if (sharder) {
        log.info("killing old sharder...");
        sharder.kill();
    }
    sharder = await fork("./src/sharder.js");
    log.info("forked sharder.ts");
    sharder.on("error", (error) => {
        log.error(`sharder.ts errored: ${error.message}`);
    });
    sharder.on("exit", (code) => {
        log.fatal(`[PEPPERCRITICAL] sharder exited with code ${code}, restarting in 5 minutes...`);
        setTimeout(forkSharder, 300000);
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

forkSharder();