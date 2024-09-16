import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";
import { Collection } from "discord.js";
import process from "node:process";

const config = globals.config;

const processes = ["site", "sharder", "shard"];

const data = new CommandData();
data.setName("restart");
data.setDescription("process.exit(0)");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist(["440163494529073152"]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.addStringOption((option) =>
    option
        .setName("process")
        .setDescription("what process to restart")
        .setRequired(false)
        .addChoices([
            { name: "site", value: "site" },
            { name: "sharder", value: "sharder" },
            { name: "shard", value: "shard" },
        ])
);
data.addIntegerOption((option) => option.setName("shardid").setDescription("shard id").setRequired(false));
const command = new Command(
    data,
    async function getArguments(message, gconfig) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        const prefix = gconfig.prefix || config.generic.prefix
        let argument = message.content.slice(
            prefix.length + commandLength
        );
        if (argument) {
            argument.trim();
        } // this is necessary because if there are no arguments supplied argument will be equal to undefined and trim() will not be a function and thus will error
        args.set("process", argument.split(" ")[0]);
        if (args.get("process") == "shard") {
            args.set("shardid", argument.split(" ")[1]);
        }
        return args;
    },
    async function execute(message, args) {
        if (args.get("process")) {
            if (processes.includes(args.get("process"))) {
                if (args.get("process") == "shard") {
                    await action.reply(
                        message,
                        `restarting shard #${args.get("shardid")}...`
                    );
                    process.send({ action: "restart", process: args.get("process"), shardId: args.get("shardid") });
                    return;
                }
                await action.reply(
                    message,
                    `restarting ${args.get("process")} process...`
                );
                process.send({ action: "restart", process: args.get("process") });
                return;
            } else {
                await action.reply(message, `invalid process. valid processes are: ${processes.join(", ")}`);
                return;
            }
        }
        await action.reply(message, "Bye Bye! 🌶");
        process.exit(0);
    }
);
export default command;
