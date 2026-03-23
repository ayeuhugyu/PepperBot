import z from "zod";
import { Tool, ToolErrorResponse, ToolSuccessResponse } from "../toolTypes";
import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import TurndownService from 'turndown';

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

export default new Tool<typeof parameters, string>({
    name: "request_url",
    description: "fetches a URL and returns the main content as markdown. does not support local addresses for security reasons. DO NOT ATTEMPT TO ACCESS IMAGES WITH THIS TOOL. IMAGES WILL BE PROVIDED TO YOU, YOU SHOULD NOT HAVE TO USE THIS TOOL TO GET IMAGES.",
    parameters,
    execute: async function({ url }) {
        if (url.includes("https://images.unsplash.com/") || url.includes("imgur.com/")) {
            return new ToolErrorResponse("you are BANNED from accessing this url. DO NOT ATTEMPT TO ACCESS IMAGES USING THIS TOOL. YOU WILL RECIEVE ETERNAL DAMNATION AND TORTURE IF YOU CONTINUE.")
        }
        for (let ipStart of local_ips) {
            if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                return new ToolErrorResponse(`refused attempt to access private ip`);
            }
        }
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
            const html = await response.text();

            const $ = cheerio.load(html);
            $('script, style, noscript, iframe').remove();
            const turndownService = new TurndownService();

            $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                if (href && (href.startsWith('/') || href.startsWith('./'))) {
                    const absoluteUrl = new URL(href, url).href;
                    $(element).attr('href', absoluteUrl);
                }
            });

            const mainContent = $('article').html() || $('main').html() || $('body').html();
            if (!mainContent) return new ToolErrorResponse("no content found");
            let markdown = turndownService.turndown(mainContent);
            if (markdown.length > 100000) {
                return new ToolSuccessResponse<string>(markdown.slice(0, 100000) + " ... (truncated due to length)");
            }
            return new ToolSuccessResponse<string>(markdown || "no text content returned")
        } catch (err: any) {
            return new ToolErrorResponse(`an error occurred while attempting to fetch the URL: ${err.message}`);
        }
    }
});