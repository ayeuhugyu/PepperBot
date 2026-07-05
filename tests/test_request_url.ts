import { tools } from "../src/lib/gpt/tools";

const res = await tools["request_url"].execute({ url: "https://duckduckgo.com/?q=puppeteer+page.goto+Navigating+frame+was+detached&t=ffab&ia=web" });
if (res.error) {
    console.log(res);
} else {
    console.log(res.data);
}
process.exit(0);