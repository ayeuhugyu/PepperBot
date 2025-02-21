import * as readline from 'readline';
import * as fs from 'fs';
import { getCurrentUpdateNumber, Update, writeUpdate } from '../src/lib/update_manager';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => rl.question(question, resolve));
};

const main = async () => {
    try {
        const updateId = await askQuestion('Enter update ID: ');
        const timestampInput = await askQuestion('Enter timestamp (MM/DD/YYYY HH:MM): ');
        const timestamp = new Date(timestampInput).getTime();
        console.log(timestamp);
        const messageId = await askQuestion('Enter message ID: ');
        const major = (await askQuestion('Is this a major update? (y/n): ') === 'y');
        await askQuestion('Press enter once you have updated the content in updateContent.txt');

        const filePath = './updateContent.md';
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const updateData = new Update({
            update: parseInt(updateId || (await getCurrentUpdateNumber() + 1).toString()),
            time: new Date(timestamp || Date.now()),
            message_id: messageId,
            text: fileContent,
            major: major
        });

        console.log(updateData)

        console.log(await writeUpdate(updateData));

        console.log('Update created successfully!');
    } catch (error) {
        console.error('Error creating update:', error);
    } finally {
        rl.close();
    }
};

await main();
process.exit(0);

// last on message https://canary.discord.com/channels/1112819622505365556/1171660137946157146/1217640350336946220