import { Conversation, GPTMessage } from "../src/lib/gpt/main";
import { Models } from "../src/lib/gpt/models";

async function testMistralRaw() {
    console.log("Testing Mistral API with raw fetch...\n");

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        console.error("MISTRAL_API_KEY not set");
        process.exit(1);
    }

    const url = "https://api.mistral.ai/v1/chat/completions";
    const payload = {
        model: "mistral-small-latest",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant."
            },
            {
                role: "user",
                content: "Hello, how are you?"
            }
        ],
        temperature: 1,
        top_p: 1,
        max_tokens: 4096,
    };

    console.log("URL:", url);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("\n--- Making request ---\n");

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        console.log("Headers:", Object.fromEntries(response.headers));

        const text = await response.text();
        console.log("\n--- Response Body (Raw Text) ---\n");
        console.log(text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log("\n--- Response Body (Parsed) ---\n");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testMistralRaw();
