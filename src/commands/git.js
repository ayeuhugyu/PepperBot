import * as action from "../lib/discord_action.js";
import {
    Command,
    CommandData,
    SubCommand,
    SubCommandData,
} from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";
import { Collection } from "discord.js";
import shell from "shelljs";
import * as files from "../lib/files.js";
import * as log from "../lib/log.js";

const config = globals.config;

const graphdata = new SubCommandData();
graphdata.setName("log");
graphdata.setDescription("returns a graph of the git history");
graphdata.setPermissions([]);
graphdata.setPermissionsReadable("");
graphdata.setWhitelist([]);
graphdata.setCanRunFromBot(true);

const graph = new SubCommand(
    graphdata,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        const sent = await action.reply(message, {
            content:
                "fetching git data... (this may take a while if this command hasn't been used in a while)",
            ephemeral: gconfig.useEphemeralReplies,
        });
        const fetchout = await shell.exec(`sudo git fetch`, { silent: true });
        if (fetchout.stderr) {
            action.editMessage(sent, {
                content: "error fetching git data, the error has been logged.",
            });
            log.error(fetchout.stderr);
            return;
        }
        const output = await shell.exec(
            `git log --graph --abbrev-commit --decorate --format=format:"%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)" --all`,
            { silent: true }
        );
        if (output.stderr) {
            action.editMessage(sent, {
                content: "error creating git log, the error has been logged.",
            });
            log.error(output.stderr);
            return;
        }
        const file = await files.textToFile(output.stdout, "gitlog");
        action.editMessage(sent, {
            content: "here's a log of commits to the pepperbot repository",
            files: [
                {
                    attachment: file,
                    name: "gitlog.txt",
                },
            ],
        });
    }
);

const data = new CommandData();
data.setName("git");
data.setDescription("returns the github repo for this bot");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setAliases(["github", "openpepper", "repo"]);
data.setCanRunFromBot(true);
;
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to use")
        .setRequired(false)
        .setChoices({ name: "log", value: "log" })
);

const command = new Command(
    data,
    async function getArguments(message) {
        const args = new Collection();
        args.set("_SUBCOMMAND", message.content.split(" ")[1]);
        return args;
    },
    async function execute(message, args, fromInteraction, gconfig) {
        let content = "";
        if (args.get("_SUBCOMMAND")) {
            content += `${args.get(
                "_SUBCOMMAND"
            )} is not a valid subcommand. anyways, `;
        }
        content +=
            "the public repo for this bot can be found at https://github.com/ayeuhugyu/PepperBot/";
        action.reply(message, {
            content: content,
            ephemeral: gconfig.useEphemeralReplies,
        });
    },
    [graph]
);

export default command;
