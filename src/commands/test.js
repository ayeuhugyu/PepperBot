import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("test");
data.setDescription("generic testing command");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setIntegrationTypes([0, 1])
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args, isInteraction, gconfig) {
        const start = performance.now();
        const sent = await action.reply(message, {
            content: "awaiting response...",
            ephemeral: gconfig.useEphemeralReplies,
        });
        action.editMessage(sent, {
            content: `response time: ${(performance.now() - start).toFixed(
                3
            )}ms`,
        });
    }
);

export default command;
