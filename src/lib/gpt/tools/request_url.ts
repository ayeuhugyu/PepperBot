import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import * as cheerio from "cheerio";
import TurndownService from 'turndown';
import puppeteer from 'puppeteer-extra';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from "puppeteer";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { Browser } from "puppeteer";
import * as log from "../../log";
import UserAgent from "user-agents";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
}))

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
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-zygote', '--deterministic-fetch', '--disable-features=IsolateOrigins', '--disable-site-isolation-trails', '--disable-gpu'],
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

        let html: string | undefined;
        const browser = await getBrowser();
        log.debug(`fetched browser at ${browser.process()?.pid}`);

        const page = await browser.newPage();
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            page.setDefaultTimeout(5000);
            page.setDefaultNavigationTimeout(5000);
            log.debug(`created new page`);

            log.debug(`waiting for load`);
            let waitForNaviation = page.waitForNavigation({ waitUntil: "load" }).catch(log.debug);
            await page.mainFrame().goto(url);
            await waitForNaviation.catch(log.debug);
            await page.bringToFront().catch(log.debug);

            // wait 0.5 seconds
            log.debug(`waiting for additional redirects`);
            await new Promise(resolve => setTimeout(resolve, 500));

            log.debug(`acquiring page content...`)
            html = await page.mainFrame().content();

            const startTime = Date.now();
            const maxTime = 2000; // 2 seconds
            let mainContentLength = 0;
            log.debug(`waiting for main content to not be empty`);
            while (Date.now() - startTime < maxTime) {
                const copied = cheerio.load(JSON.parse(JSON.stringify(html)));
                copied('script, style, noscript, iframe, svg, nav, footer').remove();
                const mainContent = copied('body').text() || copied('main').text() || copied('article').text() || copied('#content').text();
                mainContentLength = mainContent.length;
                if (mainContentLength > 0) {
                    log.debug(`main content is no longer empty`);
                    break; // we got some content, exit early
                }
                // wait 100ms before next poll
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            log.debug(`re-acquiring page content...`)
            html = await page.mainFrame().content();
        } catch (err) {
            // fallback to raw fetch
            log.warn(`failed to fetch ${url} using browser, falling back to node-fetch. error:`);
            log.warn(err);
        } finally {
            setTimeout(async () => {
                await page.close().catch(log.debug);
            }, 30000); // put this on a timeout to allow things to keep caching ven if we fail
        }

        if (!html) {
            const options: RequestInit = {
                method: 'GET',
                headers: {
                    'User-Agent': new UserAgent().toString(), // prevents a lot of sites that block the default nodejs user agent
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*\/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'Connection': 'keep-alive',
                }
            }

            try {
                const response = await fetch(url, options);
                html = await response.text();
            } catch (err: any) {
                return new ToolErrorResponse("failed to fetch url: " + err.message);
            }
        }
        try {
            if (!html) {
                return new ToolErrorResponse("failed to fetch url: couldn't find html content");
            }
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

            if (!mainContent) return new ToolErrorResponse("[SYSTEM]: no content found");

            let markdown = turndownService.turndown(mainContent);

            if (markdown.length > 100000) {
                return new ToolSuccessResponse<string>(markdown.slice(0, 100000) + " ... (truncated)");
            }

            return new ToolSuccessResponse<string>(markdown || "[SYSTEM]: no text content returned");
        } catch (err: any) {
            return new ToolErrorResponse(`failed to parse html into markdown: ${err.message}`);
        }
    }
});