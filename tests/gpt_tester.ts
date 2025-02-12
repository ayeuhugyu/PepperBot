#!/usr/bin/env -S npm run tsn -T

import { inspect } from 'node:util';
import OpenAI from 'openai';

const openai = new OpenAI();

function get() {
    return "test"
}

async function main() {
    let ratelimited = false;
    let messageSinceLastRateLimit = "";

    const runner = await openai.beta.chat.completions
    .runTools({
        tools: [{
            type: 'function',
            function: {
                name: 'test',
                description:
                "test",
                parameters: {},
                function: get,
                parse: JSON.parse,
            }
    }],
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi, call the test function' }],
    })
    .on('message', (data) => {
        console.log(`message: `);
        console.log(inspect(data, { depth: Infinity, colors: true }));
    }).on('functionCall', (functionCall) => {
        console.log(`function call: `);
        console.log(functionCall);
    }).on('functionCallResult', (functionCallResult) => {
        console.log(`function call result: `);
        console.log(functionCallResult);
    })
    const result = await runner.finalChatCompletion();
    console.log(result.choices[0].message.content);
}

main();