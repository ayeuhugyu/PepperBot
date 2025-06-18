// this script is ONLY here to restart the other processes, nothing else.
import * as log from "./lib/log";
import { ChildProcess, fork } from "child_process";

let bot: ChildProcess | undefined = undefined;

function startBot() {
    if (bot) {
        log.info("bot process already running, killing it...");
        bot.kill();
        bot = undefined;
    }
    log.info("starting bot process...");
    bot = fork("src/bot.ts")
    const errors = ["error", "exit"];
    errors.forEach((error) => {
        bot?.on(error, (err) => {
            log.fatal(`bot process errored on ${error}: `);
            log.fatal(err);
            startBot();
        });
    });

    bot.on("message", (msg) => {
        if (msg === "restart") {
            log.info("bot process restarting...");
            startBot();
        }
    });
}

startBot();