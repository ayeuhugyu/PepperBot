import { Command, CommandCategory, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";

const command = new Command(
    {
        name: 'test',
        description: 'Test command',
        category: CommandCategory.Other,
        pipable_to: ['test'],
    }, 
    async function getArguments () {
        return undefined;
    },
    async function execute ({ message, piped_data, will_be_piped, guildConfig }) {
        const start = performance.now();
        const sent = await action.reply(message, { content: "awaiting response...", ephemeral: guildConfig.other.use_ephemeral_replies });
        if (!sent) return;
        const end = performance.now();
        if (will_be_piped) {
            action.edit(sent, { content: `response time: ${(end - start).toFixed(3)}ms` })
            return new CommandResponse({ pipe_data: { start: start }});
        } else if (piped_data?.data) {
            action.edit(sent, { content: `response time: ${(end - start).toFixed(3)}ms, totaled to ${(end - piped_data.data.start).toFixed(3)}ms` })
            return new CommandResponse({});
        } else {
            action.edit(sent, { content: `response time: ${(end - start).toFixed(3)}ms` })
            return new CommandResponse({});
        }
    }
);

export default command;