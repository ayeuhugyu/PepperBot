import { tools } from "../src/lib/gpt/tools";

console.log(await tools["request_url"].execute({ url: "https://crouton.net/" }));
process.exit(0);