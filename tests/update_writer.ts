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
        const timestamp = await askQuestion('Enter timestamp: ');
        const messageId = await askQuestion('Enter message ID: ');
        await askQuestion('Press enter once you have updated the content in updateContent.txt');

        const filePath = './updateContent.txt';
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const updateData = new Update({
            update: parseInt(updateId || (await getCurrentUpdateNumber()).toString()),
            time: new Date(timestamp),
            message_id: messageId,
            text: fileContent
        });

        writeUpdate(updateData);

        console.log('Update created successfully!');
    } catch (error) {
        console.error('Error creating update:', error);
    } finally {
        rl.close();
    }
};

main();
process.exit(0);