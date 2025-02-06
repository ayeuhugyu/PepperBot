import * as log from "./lib/log";
import { fork, ChildProcess } from "node:child_process";
import { startServer } from "./lib/communication_manager";

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

const app = await startServer("main", 50000);
if (app instanceof Error) {
    log.error(app.message);
    process.exit(1);
}
app.get("/kill", (req, res) => {
    log.warn("kill request received, shutting down...");
    res.sendStatus(200).send("shutting down...");
    process.exit(0);
});
app.post("/restart", (req, res) => {
    const processName = req.body.process;
    log.info(`restarting ${processName}...`);
    res.sendStatus(200).send(`restarting ${processName}...`);
    switch (processName) {
        case "sharder":
            forkSharder();
            break;
        default:
            log.warn(`unknown process ${processName}`);
            break;
    }
});

forkSharder();