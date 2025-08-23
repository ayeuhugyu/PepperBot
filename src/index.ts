// this script is ONLY here to restart the other processes, nothing else.
import * as log from "./lib/log";
import { ChildProcess, fork } from "child_process";


let bot: (ChildProcess | undefined) = undefined;
let restartDelay = 2 * 60 * 1000; // 2 minutes in ms
let quickExitCount = 0;
const minUptime = 10 * 1000; // 10 seconds

async function pullFromMain() {
    log.info("pulling latest changes from main...");
    // Use dynamic import to avoid ESM/CJS issues
    await import("../scripts/pull");
    log.info("pull complete.");
}

function startBot() {
    if (bot) {
        log.info("bot process already running, killing it...");
        bot.kill();
        bot = undefined;
    }
    log.info("starting bot process...");
    const startTime = Date.now();
    bot = fork("src/bot.ts");

    let handledQuickExit = false;

    bot.on("exit", async (code, signal) => {
        const uptime = Date.now() - startTime;
        if (uptime < minUptime) {
            quickExitCount++;
            handledQuickExit = true;
            if (quickExitCount === 1) {
                restartDelay = 2 * 60 * 1000; // 2 minutes
            } else {
                restartDelay = 5 * 60 * 1000; // 5 minutes
            }
            log.fatal(`bot process exited after ${uptime / 1000}s (code: ${code}, signal: ${signal}). waiting ${restartDelay / 1000}s before restart; will pull latest commit`);
            await new Promise(res => setTimeout(res, restartDelay));
            await pullFromMain();
            startBot();
        } else {
            // Reset quick exit count and delay if bot runs > minUptime
            quickExitCount = 0;
            restartDelay = 2 * 60 * 1000;
            log.info(`bot process exited after ${uptime / 1000}s (code: ${code}, signal: ${signal}). restarting immediately...`);
            startBot();
        }
    });

    bot.on("error", (err) => {
        log.fatal("bot process errored:");
        log.fatal(err);
        if (!handledQuickExit) {
            startBot();
        }
    });

    bot.on("message", (msg) => {
        if (msg === "restart") {
            log.info("bot process restarting...");
            startBot();
        }
    });
}

startBot();