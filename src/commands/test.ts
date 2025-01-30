import { Command, CommandCategory } from "../lib/classes/command";

const command = new Command(
    {
        name: 'test',
        description: 'Test command',
        category: CommandCategory.Other,
    }, 
    async function getArguments () {
        return undefined;
    },
    async function execute ({ message }) {
        message.reply('tester tested!')
    }
);

export default command;