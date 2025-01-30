import { Command } from "../lib/classes/command";

const command = new Command(
    {
        name: 'test',
        description: 'Test command',
    }, 
    async function getArguments ({ message }) {
        return undefined;
    },
    async function execute ({ message }) {
        message.reply('tester tested!')
    }
);

export default command;