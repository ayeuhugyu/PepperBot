// #region Imports

import * as mathjs from 'mathjs';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import * as log from "../log";
import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import TurndownService from 'turndown';
import chalk from 'chalk';
import { DiscordAnsi } from "../discord_ansi";

// #endregion
// #region Tool Classes

export interface ToolParameter {
    key: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    arraytype?: 'string' | 'number' | 'boolean' | 'object'; // if the type is an array, this is the type of the items in the array
    required?: boolean;
    default?: string | number | boolean | object | any[];
}

export enum ToolType {
    Official = 'official',
    User = 'user'
}

export class ToolData {
    name: string;
    description: string;
    parameters: Record<string, ToolParameter>;
    type: ToolType;
    disabledDefault?: boolean = false;

    constructor(name: string, description: string, type: ToolType, parameters?: Record<string, ToolParameter>, disabledDefault?: boolean) {
        this.name = name;
        this.description = description;
        this.type = type;

        this.parameters = parameters || {};
        this.disabledDefault = disabledDefault;
    }
}

type ToolFunction = (args: any) => Promise<any> | any;

export class Tool {
    public data: ToolData;
    public function: ToolFunction;

    constructor(data: ToolData, func: ToolFunction) {
        this.data = data;
        this.function = func;
    }

    static fromFake(fakeData: FakeToolData): Tool {
        const data = new ToolData(
            fakeData.name,
            fakeData.description,
            ToolType.User,
            fakeData.parameters,
            false
        );
        return new Tool(data, async (args: any) => {
            return `A fake tool was somehow executed. This should never happen. Tool name: ${data.name}, description: ${data.description}`;
        });
    }

    serialize(discordCompatible = false) {
        const c = discordCompatible ? DiscordAnsi : chalk;
        const lines = [];
        lines.push(
            (discordCompatible
                ? c.bgBlue(c.bold(" Tool ")) + c.gray(`  [${this.data.name}]  `) + c.gray(`[${this.data.type}]`)
                : chalk.bgBlueBright.bold.black(" Tool ") + chalk.gray(`  [${this.data.name}]  `) + chalk.gray(`[${this.data.type}]`)
            )
        );
        lines.push(c.bold("Description:") + " " + c.white(this.data.description));
        if (this.data.parameters && Object.keys(this.data.parameters).length > 0) {
            lines.push(c.bold("Parameters:") +
                "\n" + Object.values(this.data.parameters).map(param =>
                    c.cyan("  • ") + (discordCompatible ? DiscordAnsi.gold(param.key) : chalk.yellow(param.key)) + c.gray(` (${param.type}` + (param.arraytype ? `:${param.arraytype}` : "") + ")") +
                    (param.description ? c.gray(": ") + c.white(param.description) : "") +
                    (param.default !== undefined ? c.gray(" [default: ") + c.white(JSON.stringify(param.default)) + c.gray("]") : "")
                ).join("\n")
            );
        } else {
            lines.push(c.bold("Parameters:") + " " + c.gray("[none]"));
        }
        if (this.data.disabledDefault) {
            lines.push(c.red("Disabled by default"));
        }
        lines.push("");
        return lines.join("\n");
    }
}

export type FakeToolData = Omit<ToolData, 'type' | 'disabledDefault'>
// #endregion
// #region Tool Helpers

let local_ips = ["192.168", "172.16", "10", "localhost"];
for (let i = 17; i <= 31; i++) {
    local_ips.push(`172.${i}`);
}

function runLuauScript(luauCode: string): Promise<{ stdout: string; stderr: string }> {
    const filePath = "cache/luau/" + Date.now() + ".luau";
    return new Promise((resolve, reject) => {
        try {
            // write to the file synchronously
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, luauCode);
            // create a promise that runs the luau script
            const child = execFile('lune', ['run', filePath], (error, stdout, stderr) => {
                if (error) {
                    reject(`error executing luau script: ${error}`);
                    return;
                }
                resolve({ stdout, stderr });
            });
            // set a timeout for 5 seconds
            const timeout = setTimeout(() => {
                child.kill();
                reject('script execution timed out; 5 second limit exceeded. this is likely due to an infinite loop somewhere in your code.');
            }, 5000);
            // clear the timeout if the script finishes in time
            child.on('exit', () => clearTimeout(timeout));
        } catch (err) {
            reject(`error writing file: ${err}`);
        }
    });
}

// #endregion
// #region Tool Definitions

export const tools: Record<string, Tool> = {
    // #region Math
    'math': new Tool(
        new ToolData(
            'math',
            'evaluates a mathematical expression. Supports most mathjs functions, it just gets plugged directly into mathjs.evaluate(). this should only be used when you must use math.',
            ToolType.Official,
            {
                "expression": { key: 'expression', description: 'mathematical expression to evaluate', type: 'string', required: true }
            },
            true // disabled by default
        ),
        ({ expression }: { expression: string }) => {
            try {
                return mathjs.evaluate(expression);
            } catch (err: any) {
                return `an error occurred while attempting to evaluate the expression: ${err.message}`;
            }
        }
    ),
    // #endregion
    // #region Pick Random
    'pick_random': new Tool(
        new ToolData(
            'pick_random',
            'picks a random item from a list of items. This should only ever be used when a user explicitly states to pick something at random. Do not use this for any other reason.',
            ToolType.Official,
            {
                "items": { key: 'items', description: 'list of items to choose from', type: 'array', arraytype: 'string', required: true }
            },
            true // disabled by default
        ),
        ({ items }: { items: string[] }) => {
            if (!items || items.length === 0) {
                return "ERROR: No items provided.";
            }
            return items[Math.floor(Math.random() * items.length)];
        }
    ),
    // #endregion
    // #region Request URL
    'request_url': new Tool(
        new ToolData(
            'request_url',
            'Fetches a URL and returns the main content as markdown. Does not support local addresses for security reasons. DO NOT ATTEMPT TO ACCESS IMAGES WITH THIS TOOL. IMAGES WILL BE PROVIDED TO YOU, YOU SHOULD NOT HAVE TO USE THIS TOOL TO GET IMAGES.',
            ToolType.Official,
            {
                "url": { key: 'url', description: 'URL to fetch. Do not input local addresses. IPs are fine, just not local ones.', type: 'string', required: true }
            },
            false,
        ),
        async ({ url }: { url: string }) => {
            if (!url) {
                return "ERROR: No URL provided.";
            }
            if (url.includes("https://images.unsplash.com/") || url.includes("imgur.com/")) {
                return "ERROR: you are BANNED from accessing this url. DO NOT ATTEMPT TO ACCESS IMAGES USING THIS TOOL. YOU WILL RECIEVE ETERNAL DAMNATION AND TORTURE IF YOU CONTINUE."
            }
            for (let ipStart of local_ips) {
                if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                    log.warn(`attempt to access local ip from request_url`);
                    return `refused attempt to access private ip from request_url`;
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
                if (!mainContent) return "No content found.";
                let markdown = turndownService.turndown(mainContent);
                if (markdown.length > 100000) {
                    return markdown.slice(0, 100000) + " ... (truncated due to length)";
                }
                return markdown || "No text content returned."
            } catch (err: any) {

                log.warn(`an error occurred while attempting to fetch URL for GPT: ${err.message}`);
                return `an error occurred while attempting to fetch the URL: ${err.message}`;
            }
        }
    ),
    // #endregion
    // #region Request Raw URL
    "request_raw_url": new Tool(
        new ToolData(
            'request_raw_url',
            'Fetches a URL with the specified method, headers, and body, and returns the response. Does not support local addresses for security reasons. For almost all research or information gathering uses, this is not necessary, and request_url will be better.',
            ToolType.Official,
            {
                "url": { key: 'url', description: 'URL to fetch. Do not input local addresses. IPs are fine, just not local ones.', type: 'string', required: true },
                "method": { key: 'method', description: 'HTTP method to use (GET, POST, PUT, DELETE, etc.).', type: 'string', required: false, default: 'GET' },
                "headers": { key: 'headers', description: 'Headers to include in the request.', type: 'object', required: false, default: {} },
                "body": { key: 'body', description: 'Body of the request, for methods like POST or PUT.', type: 'object', required: false, default: '' }
            },
            true // disabled by default
        ),
        async ({ url, method = 'GET', headers = {}, body = '' }: { url: string, method?: string, headers?: { [key: string]: string }, body?: string }) => {
            if (!url) {
                return "ERROR: No URL provided.";
            }
            for (let ipStart of local_ips) {
                if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                    log.warn(`attempt to access local ip from request_raw_url`);
                    return `refused attempt to access private ip from request_raw_url`;
                }
            }
            const options: RequestInit = {
                method,
                headers: {
                    'User-Agent': new UserAgent().toString(),
                    ...headers,
                },
                body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            };
            try {
                const response = await fetch(url, options);
                const responseBody = await response.text();
                return {
                    status: response.status + " " + response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: responseBody,
                };
            } catch (err: any) {
                log.warn(`an error occurred while attempting to fetch URL for GPT: ${err.message}`);
                return `an error occurred while attempting to fetch the URL: ${err.message}`;
            }
        }
    ),
    // #endregion
    // #region Search
    "search": new Tool(
        new ToolData(
            'search',
            'searches Google for a query and returns the results. snippets will never be enough to provide accurate information, so always use this in conjunction with request_url to provide further information. do not simply link users to the results, actually follow them.',
            ToolType.Official,
            {
                "query": { key: 'query', description: 'query to search for', type: 'string', required: true }
            },
            false
        ),
        async ({ query }: { query: string }) => {
            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.error) {
                    log.warn(`an error occurred while attempting to search Google for GPT: ${data.error.message}`);
                    return `an error occurred while attempting to search Google: ${data.error.message}`;
                }
                const results = Array.isArray(data.items) ? data.items : [data.items];
                let newResults = [];
                for (let result of results) {
                    if ((typeof result == 'object')) {
                        newResults.push({ title: result.title, snippet: result.snippet, link: result.link })
                    }
                }
                if (newResults.some((result) => result == undefined) || newResults.length == 0) {
                    log.warn(`error while searching Google for GPT: no results found`);
                    return "no results found; full response: " + JSON.stringify(data, null, 2);
                }
                return newResults;
            } catch (err: any) {
                log.warn(`an error occurred while attempting to search Google for GPT: ${err.message}`);
                return `an error occurred while attempting to search Google: ${err.message}`;
            }
        }
    ),
    // #endregion
    // #region Evaluate Luau
    "evaluate_luau": new Tool(
        new ToolData(
            'evaluate_luau',
            'evaluates a luau expression. this should only be used to automate complex tasks. MAKE ABSOLUTELY CERTAIN THAT YOU USE A PRINT STATEMENT! this just returns stdout, so if you don\'t print something, it won\'t be shown to you. If you are returned an error, fix it and try again (if possible). You do not have access to ROBLOX\'s \'task\' library, do not attempt to use it.',
            ToolType.Official,
            {
                "expression": { key: 'expression', description: 'luau expression to evaluate', type: 'string', required: true }
            },
            true // disabled by default
        ),
        async ({ expression }: { expression: string }) => {
            if (!expression.includes("print")) {
                return "ERROR: the expression must contain a print statement. please remember to print your output.";
            }
            try {
                const result = await runLuauScript(expression);
                return result.stdout || result.stderr || "No output returned.";
            } catch (err: any) {
                return `an error occurred while attempting to evaluate the expression: ${err.message || err}`;
            }
        }
    ),
    // #endregion
}
// #endregion