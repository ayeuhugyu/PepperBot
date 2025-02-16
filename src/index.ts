import * as log from "./lib/log";
import { fork, ChildProcess } from "node:child_process";
import { startServer as startCommunicationServer } from "./lib/communication_manager";
import { startServer as startWebServer } from "./web";

log.info("starting bot...");
let sharder: ChildProcess;

async function forkSharder() {
    return new Promise(async (resolve) => {
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

        sharder.on("message", (msg) => { // this is the only time i will ever use this Horrendous System
            if (msg === "ready") resolve(true);
        });
    })
}

async function forkWeb() {
    log.info("forking web interface..."); // The Notepocalypse. The Webening. The Webpocalypse. (Web 3: Revenge of the Sith) (Web 4: A New Hope) (Web 5: The Empire Strikes Back) (Web 6: Return of the Jedi) (Web 7: The Force Awakens) (Web 8: The Last Jedi) (Web 9: The Rise of Skywalker) (Web 10: The Phantom Menace) (Web 11: Attack of the Clones) (Web 12: Revenge of the Sith) (Web 13: A New Hope) (Web 14: The Empire Strikes Back) (Web 15: Return of the Jedi) (Web 16: The Force Awakens) (Web 17: The Last Jedi) (Web 18: The Rise of Skywalker) (Web 19: The Phantom Menace) (Web 20: Attack of the Clones) (Web 21: Revenge of the Sith) (Web 22: A New Hope) (Web 23: The Empire Strikes Back) (Web 24: Return of the Jedi) (Web 25: The Force Awakens) (Web 26: The Last Jedi) (Web 27: The Rise of Skywalker) -- Github Copilot (Darth Vader): It is pointless to resist. Your life, the poetry. Surrender to the dark side of the Force. It is the only way you can save your world. -- Anakin Skywalker (Darth Vader) -- Github Copilot. (-- Darth Plagueis the Wise) -- Github Copilot. -- Emperor Palpatine (Darth Sidious) -- Github Copilot. -- Yoda -- Github Copilot. -- Obi-Wan Kenobi -- Github Copilot. -- Qui-Gon Jinn -- Github Copilot. -- Mace Windu -- Github Copilot. -- Kit Fisto -- Github Copilot
    // mb
    // TODO: implement error handling and restart on crash

    // TODO: this is a placeholder port 
    // jsyk i've been using 53134 for http and 443 for https, so those are already port forwarded. my port 80 is occupied by fucking ghost apache or something like that
    // TODO: find a different location
    // web server must be started after the bot is logged in to prevent errors when accessing client!
    startWebServer(50001); // may replace in the future with a child process, but for now its just gonna be this
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
forkWeb();