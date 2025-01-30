import { Command, CommandCategory, CommandResponse } from "../lib/classes/command";

const command = new Command(
    {
        name: 'test',
        description: 'Test command',
        category: CommandCategory.Other,
        pipable_to: ['test']
    }, 
    async function getArguments () {
        return undefined;
    },
    async function execute ({ message, piped_data, will_be_piped }) {
        if (piped_data?.data) {
            const int = piped_data.data.int;
            message.reply(`mister piper! ${int}`);
            return new CommandResponse({ pipe_data: { int: int + 1 } });
        }
        if (will_be_piped) {
            message.reply('mister piper!');
        } else {
            message.reply('tester tested!');
        }
        return new CommandResponse({ pipe_data: { int: 0 } });
    }
);

export default command;