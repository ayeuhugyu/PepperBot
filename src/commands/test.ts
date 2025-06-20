import { Command, CommandResponse } from "../lib/classes/command";
import * as action from "../lib/discord_action";
import { CommandTag } from "../lib/classes/command_enums";


const command = new Command(
    {
        name: 'test',
        description: 'returns the time it takes for a message to be sent and recieved',
        long_description: 'returns the time it takes for a message to be sent to discord\'s servers and then recieved back',
        tags: [CommandTag.Debug],
        pipable_to: ['test'],
        example_usage: "p/test",
        aliases: ["ping"],
    },
    async function getArguments () {
        return undefined;
    },
    async function execute ({ invoker, piped_data, will_be_piped, guild_config }) {
        const start = performance.now();
        const sent = await action.reply(invoker, { content: "awaiting response...", ephemeral: guild_config.other.use_ephemeral_replies });
        if (!sent) return;
        const end = performance.now();
        if (will_be_piped) {
            action.edit(sent, { content: `response time: ${(end - start).toFixed(3)}ms` })
            return new CommandResponse({ pipe_data: { start: start } });
        } else if (piped_data?.data) {
            action.edit(sent, { content: `response time: ${(end - start).toFixed(3)}ms, totaled to ${(end - piped_data.data.start).toFixed(3)}ms` })
            return new CommandResponse({ pipe_data: { start: piped_data.data.start, end: end } });
        } else {
            action.edit(sent, { content: `response time: ${(end - start).toFixed(3)}ms` })
            return new CommandResponse({});
        }
    }
);

export default command;