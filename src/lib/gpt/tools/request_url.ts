import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import * as cheerio from "cheerio";
import TurndownService from 'turndown';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from "puppeteer";
import * as log from "../../log";

puppeteer.use(StealthPlugin());

let local_ips = ["192.168", "172.16", "10", "localhost"];
for (let i = 17; i <= 31; i++) {
    local_ips.push(`172.${i}`);
}

const parameters = {
    "url": {
        key: "url",
        description: "URL to fetch. do not input local addresses. ips are fine, just not local ones.",
        schema: z.string(),
    },
}

let browserInstance: Browser | null = null;

async function getBrowser() {
    if (!browserInstance || !browserInstance.connected) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    }
    return browserInstance;
}

export default new Tool<typeof parameters, string>({
    name: "request_url",
    description: "fetches a URL and returns the main content as markdown. does not support local addresses for security reasons. DO NOT ATTEMPT TO ACCESS IMAGES WITH THIS TOOL. IMAGES WILL BE PROVIDED TO YOU, YOU SHOULD NOT HAVE TO USE THIS TOOL TO GET IMAGES.",
    parameters,
    execute: async function({ url }) {
        log.debug(`requesting url ${url}`);
        if (url.includes("https://images.unsplash.com/") || url.includes("imgur.com/")) {
            return new ToolErrorResponse("you are BANNED from accessing this url. DO NOT ATTEMPT TO ACCESS IMAGES USING THIS TOOL. YOU WILL RECIEVE ETERNAL DAMNATION AND TORTURE IF YOU CONTINUE.")
        }
        for (let ipStart of local_ips) {
            if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                return new ToolErrorResponse(`refused attempt to access private ip`);
            }
        }

        try {
            const browser = await getBrowser();
            log.debug(`fetched browser at ${browser.process()?.pid}`);

            const page = await browser.newPage();
            log.debug(`created new page`);

            await page.setViewport({ width: 1920, height: 1080 });

            log.debug(`waiting for domcontentloaded`);
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            const isChallenge = await page.evaluate(() => {
                const title = document.title.toLowerCase();
                const bodyText = document.body.innerText.toLowerCase();

                const challengeIndicators = [
                    'checking your browser',
                    'just a moment',
                    'verify you are human',
                    'security check',
                    'ddos protection',
                    'completing the challenge'
                ];

                // check title or body for "waiting" keywords
                const hasKeywords = challengeIndicators.some(phrase =>
                    title.includes(phrase) || bodyText.includes(phrase)
                );

                // check if the body is suspiciously empty, but not if its nearly completely empty
                const bodyLength = document.body.querySelectorAll('*').length
                const isVerySmall = bodyLength < 10 && bodyLength > 2;

                return hasKeywords || isVerySmall;
            });

            if (isChallenge) {
                log.debug("challenge page detected");

                try {
                    // wait for the url to change or for a 'main' element to appear
                    await page.waitForFunction(
                        () => {
                            const isStillChallenging =
                                document.title.includes('Just a moment...') ||
                                !!document.querySelector('#cf-wrapper') ||
                                !!document.querySelector('.g-recaptcha');

                            const hasContent = !!(document.querySelector('article') || document.querySelector('main') || document.querySelector('h1'));

                            return !isStillChallenging && hasContent;
                        },
                        { timeout: 10000, polling: 'mutation' }
                    );

                    log.debug("bypass successful");
                    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 });
                } catch (e) {
                    log.debug(e);
                }
            }

            const html = await page.content();
            log.debug(`page content: ${html}`);

            await page.close();

            const $ = cheerio.load(html);

            $('script, style, noscript, iframe, svg, nav, footer').remove();

            const turndownService = new TurndownService();

            $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    try {
                        const absoluteUrl = new URL(href, url).href;
                        $(element).attr('href', absoluteUrl);
                    } catch (e) { /* ignore invalid URLs */ }
                }
            });

            const mainContent = $('body').html() || $('main').html() || $('article').html() || $('#content').html();
            log.debug(`main content: ${mainContent}`);

            if (!mainContent) return new ToolErrorResponse("[SYSTEM]: no content found");

            let markdown = turndownService.turndown(mainContent);
            log.debug(`final markdown content: ${markdown}`);

            if (markdown.length > 100000) {
                return new ToolSuccessResponse<string>(markdown.slice(0, 100000) + " ... (truncated)");
            }

            return new ToolSuccessResponse<string>(markdown || "[SYSTEM]: no text content returned");

        } catch (err: any) {
            return new ToolErrorResponse(`failed to fetch url: ${err.message}`);
        }
    }
});