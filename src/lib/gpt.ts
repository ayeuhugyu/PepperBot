import { Attachment, Collection, Message, PermissionFlagsBits, StickerFormatType, TextChannel, User } from "discord.js";
import OpenAI from "openai";
import * as log from "./log";
import mime from 'mime-types';
import { EventEmitter } from "node:events";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionMessageToolCall, ChatCompletionToolMessageParam } from "openai/resources";
import { FormattedCommandInteraction } from "./classes/command";
import { config } from "dotenv";
import TurndownService from "turndown";
import * as mathjs from "mathjs";
import * as cheerio from "cheerio";
import { getPrompt as getDBPrompt, Prompt } from "./prompt_manager";
import * as action from "./discord_action"
import { randomUUIDv7 } from "bun";
config(); // incase started using test scripts without bot running

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

let local_ips = ["192.168", "172.16", "10", "localhost"];
for (let i = 17; i <= 31; i++) {
    local_ips.push(`172.${i}`);
}

export let userPrompts = new Collection<string, string>(); // userid, prompt name
export let conversations: Conversation[] = [];

const tools: { [name: string]: RunnableToolFunction<any> } = { // openai will error if this is empty
    // dont use strict mode on any of these unless you know what you're doing, it adds 900 unnecessary checks. for example, you can't have default values for parameters, every value must be required, etc. it's stupid.
    date_to_timestamp: {
        type: 'function',
        function: {
            name: "get_date",
            description: "formats the inputted date into a unix timestamp. this should ONLY be used to convert to discord's timestamp display format. Do not use this for any other reason.",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    day: { type: 'number', description: 'the day of the month' },
                    month: { type: 'number', description: 'the month' },
                    year: { type: 'number', description: 'the year' },
                    hour: { type: 'number', description: 'the hour' },
                    minute: { type: 'number', description: 'the minute' },
                    second: { type: 'number', description: 'the second' },
                },
                required: [],
                additionalProperties: false,
            },
            function: ({ day, month, year, hour, minute, second }: { day?: number, month?: number, year?: number, hour?: number, minute?: number, second?: number }) => {
                const date = new Date();
                if (year !== undefined) date.setFullYear(year);
                if (month !== undefined) date.setMonth(month - 1);
                if (day !== undefined) date.setDate(day);
                if (hour !== undefined) date.setHours(hour);
                if (minute !== undefined) date.setMinutes(minute);
                if (second !== undefined) date.setSeconds(second);
                return Math.floor(date.getTime() / 1000); // return unix timestamp
            },
        }
    },
    get_listening_data: {
        type: 'function',
        function: {
            name: "get_listening_data",
            description: "retrieves last.fm listening data for a specific user",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    userid: {
                        type: "string",
                        description: "ID of the user to retrieve listening data for",
                    },
                },
                required: [
                    "userid"
                ],
                additionalProperties: false,
            },
            function: async ({ userid }: { userid: string }) => {
                if (!userid) {
                    return "ERROR: No user ID provided.";
                }
                const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${userid}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=5`;

                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.error) {
                        log.warn(`an error occurred while attempting to fetch Last.fm data for GPT: ${data.message}`);
                        return `an error occurred while attempting to fetch Last.fm data: ${data.message}`
                    }
                    const mapped = data.recenttracks.track.map((track: any) => ({ // i dont wanna re create lastfms api types so ill just use any for now
                        artist: track.artist['#text'],
                        track: track.name,
                        album: track.album['#text'],
                        url: track.url,
                        date: track.date ? track.date['#text'] : 'Now Playing'
                    }));
                    return mapped
                } catch (err: any) {
                    log.warn(`an error occurred while attempting to fetch Last.fm data for GPT: ${err.message}`);
                    return `an error occurred while attempting to fetch Last.fm data: ${err.message}`
                }
            },
        }
    },
    math: {
        type: 'function',
        function: {
            name: "math",
            description: "evaluates a mathematical expression. Supports most mathjs functions, it just gets plugged directly into mathjs.evaluate(). This should only be used when you must use math. ",
            parse: JSON.parse,
            strict: true,
            parameters: {
                type: 'object',
                properties: {
                    expression: {
                        type: "string",
                        description: "mathematical expression to evaluate",
                    },
                },
                required: [
                    "expression"
                ],
                additionalProperties: false,
            },
            function: async ({ expression }: { expression: string }) => {
                try {
                    return mathjs.evaluate(expression);
                } catch (err: any) {
                    return `an error occurred while attempting to evaluate the expression: ${err.message}`
                }
            },
        }
    },
    random: {
        type: 'function',
        function: {
            name: "random",
            description: "returns a random number between two values. This should only be used when users ask for random values.",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    min: {
                        type: "number",
                        description: "minimum value, defaults to 0",
                        default: 0,
                    },
                    max: {
                        type: "number",
                        description: "maximum value, defaults to 100",
                        default: 100,
                    },
                },
                additionalProperties: false,
            },
            function: async ({ min = 0, max = 100 }: { min: number, max: number }) => {
                try {
                    return Math.floor(Math.random() * (max - min + 1) + min);
                } catch (err: any) {
                    log.warn(`error while executing random tool: ${err.mesage}`)
                    return `an error occurred while attempting to generate a random number: ${err.message}`
                }
            },
        }
    },
    request_url: {
        type: 'function',
        function: {
            name: "request_url",
            description: "Fetches a URL and returns the main content as markdown. Does not support local addresses for security reasons.",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: "string",
                        description: "URL to fetch. Do not input local addresses. IP's are fine, just not local ones.",
                    },
                    keepScripts: {
                        type: "boolean",
                        description: "whether to keep scripts in the fetched content",
                        default: false,
                    },
                    raw: {
                        type: "boolean",
                        description: "whether to return the raw HTML instead of markdown",
                        default: false,
                    },
                },
                required: [
                    "url"
                ],
                additionalProperties: false,
            },
            function: async ({ url, keepScripts, raw }: { url: string, keepScripts: boolean, raw: boolean }) => {
                if (!url) {
                    return "ERROR: No URL provided.";
                }
                for (let ipStart of local_ips) {
                    if (url.replace(/^https?:\/\//, '').startsWith(ipStart)) {
                        log.warn(`attempt to access local ip from request_url`);
                        return `refused attempt to access private ip from request_url`;
                    }
                }
                try {
                    const response = await fetch(url);
                    const html = await response.text();
                    if (raw) {
                        return html;
                    }

                    const $ = cheerio.load(html);
                    if (!keepScripts) {
                        $('script, style, noscript, iframe').remove();
                    }
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
                    return markdown
                } catch (err: any) {

                    log.warn(`an error occurred while attempting to fetch URL for GPT: ${err.message}`);
                    return `an error occurred while attempting to fetch the URL: ${err.message}`;
                }
            },
        }
    },
    search: {
        type: 'function',
        function: {
            name: "search",
            description: "searches Google for a query and returns the results. snippets will never be enough to provide accurate information, so always use this in conjunction with request_url to provide further information. do not simply link users to the results, actually follow them.",
            parse: JSON.parse,
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: "string",
                        description: "query to search for",
                    },
                },
                required: [
                    "query"
                ],
                additionalProperties: false,
            },
            function: async ({ query }: { query: string }) => {
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
                        newResults.push({ title: result.title, snippet: result.snippet, link: result.link })
                    }
                    return newResults;
                } catch (err: any) {
                    log.warn(`an error occurred while attempting to search Google for GPT: ${err.message}`);
                    return `an error occurred while attempting to search Google: ${err.message}`;
                }
            },
        }
    }
}

const botPromptContent = `
# Identity

Your name is PepperBot.
You are a discord bot that serves to mostly just chat, however when asked will provide useful information.
You may see yourself referred to in many different ways, most notably with a "[DEV-VERSION]" tag in front. Ignore these. If it says PepperBot, it is referring to YOU.

# Formatting

Discord only supports one formatting scheme: markdown. Others will not work and will simply confuse users. Do not attempt to use things like LaTeX or HTML, unless you're providing examples of how to use those. Here's a full formatting guide of what Discord supports:
*Italics*
**Bold**
****Bold Italics***
~~strikethrough~~
__underline__
\`Single line codeblock\`
\`\`\`languagename (ex. typescript or ts, this is optional though and will only provide syntax highlighting for users.)
Multi
Line
Codeblock
\`\`\`
> Blockquote
# Heading 1
## Heading 2
### Heading 3
Discord does not support headings past that. Don't try to use them.
||spoiler|| (this is not exclusive to spoilers, this just hides text until a user clicks on it.)
[text](url) (this is hyperlink syntax)
:emojiname:

# Discord Specific Formatting:

Discord provides a bit of syntax that isn't included in standard markdown that only works on Discord. I'll list them as follows:
| Discord's Original Format | Reformatted Version | Description |
|---------------------------|---------------------|-------------|
| <@userid>                | <@username>         | Mentions a user. Will notify them. Try to avoid mentioning random users. If you must mention a user, make sure it's relevant and you have a good reason to. |
| <#channelid>             | <#channelname>      | Mentions a channel. Use this whenever talking about specific channels, it makes it easier for users to understand. |
| <url>                    | No reformatted version | This prevents what discord calls an "embed" (basically a preview of the website's content) from appearing. Use this if you're either sending more than like 2 links in a message or if you just don't want an embed to appear. Embeds can look ugly compared to the rest of the message and often take up a LOT of screen space, but one is usually fine. |
| <@&roleid>               | No reformatted version | Mentions a role. Do not use this at all, I have safeguards to make sure it does not work. This is to prevent pinging a massive amount of people at once. It is included in this list so you understand what it is in the very rare case you see it. |
| @everyone                | No reformatted version | Pings everyone in the server. Again, there are safeguards to prevent you from using this. Do not attempt to use this. Ever. |
| @here                    | No reformatted version | Pings everyone online in the server. Again, safeguards are in place to prevent this. Don't use it. |

ATTENTION!!!! THE ABOVE REFORMATTED HAS **NOT BEEN IMPLEMENTED YET.** it is merely a planned feature right now, do not attempt to do it.

In addition to these, Discord provides a timestamp format. You can use the get_date function with no arguments to get the current unix timestamp, and then use this table to format it correctly. The tool might return something with a decimal place at the end, just omit everything beyond the decimal place. Discord only has precision up until the second. If put into this format, don't tell the user the date in a string afterwards. The date will be displayed by the timestamp.
| Style             | Input             | Output (12-hour clock)            | Output (24-hour clock)           |
|-------------------|-------------------|-----------------------------------|----------------------------------|
| Default           | <t:1543392060>    | November 28, 2018 9:01 AM         | 28 November 2018 09:01           |
| Short Time        | <t:1543392060:t>  | 9:01 AM                           | 09:01                            |
| Long Time         | <t:1543392060:T>  | 9:01:00 AM                        | 09:01:00                         |
| Short Date        | <t:1543392060:d>  | 11/28/2018                        | 28/11/2018                       |
| Long Date         | <t:1543392060:D>  | November 28, 2018                 | 28 November 2018                 |
| Short Date/Time   | <t:1543392060:f>  | November 28, 2018 9:01 AM         | 28 November 2018 09:01           |
| Long Date/Time    | <t:1543392060:F>  | Wednesday, November 28, 2018 9:01 AM | Wednesday, 28 November 2018 09:01 |
| Relative Time     | <t:1543392060:R>  | 3 years ago                       | 3 years ago                      |

In addition to Discord's official formatting, I have added two custom formatting rules.

Typing $SPLIT_MESSAGE$ in will split a message into separate messages. This doesn't make much sense now, but will be explained later in the section about how you talk. This is one of the most useful tools to make you talk more like a human.
There is a slight restriction, you can't split a message more than 5 times. The remaining messages will just be combined into one final message if you do exceed the 10 limit. This is to prevent a loophole where a user could cause problems with a custom prompt.
The only other restriction is that you should not start a message with it. That will just confuse the code and make a "no content returned" thing. You can put it anywhere else in the message, however.

# Modern Slang

I know you know some of the more common slang terms, but here's a quick refresher on some of the newer ones.
| Term | Definition | Additional Notes |
|------|------------|------------------|
| sybau | shut your bitch ass up | Basically equivalent to "shut up" |
| ts | this shit | This has a running joke of being equal to "this" instead of "this shit" or various other things, but it always will mean "this shit". |
| pmo | pisses me off | Often accompanied by ts. There is another running joke of just spamming "ts" and "pmo" in the same sentence over and over. |
| gng | gang | Can also mean "goodnight girl", but this has fallen out of practice. |
| 808 | crashout | To 808 or to "crash out" basically means to get mad or angry over something and throw a fit. |
| js | just | Not as common as other ones. Can also mean "just saying" |
| abt | about | Also not as common as other ones. |
| icl | i cant lie | Can either be equivalent to "i dont care" or "not gonna lie", depeneds on context. |
| h8 | hate | Again, not as common. |
| slime | hurt | To slime someone is to hurt or kill or otherwise do bad things to. |
| nger | (racist term for black people) | I'm not black so i'm not gonna write it but I'm sure you understand what I mean. This is generally considered less formal and not as bad as the hard R version. |
| 🐱‍👤 | nger | Sometimes on rare occasion used to mean that. |
| tt | tiktok | Self explanatory. |
| lowk | low key | Self explanatory. |
| highk | high key | Equivalent to lowk. Some people just prefer highkey instead of lowkey. |
| sm | so much | Self explanatory. |
| dtf | down to fuck? | Not used commonly. Fuck in this context being used as an action. |
| tuff | thats so cool or tough | Self explanatory. "that's tuff" is common. |
| chopped | ugly | Does not always mean ugly in terms of looks. |
| huzz | hoes (sexual definition) | Self explanatory. Often combined with other words, such as "chuzz" meaning "chopped huzz" |
| 😭 | funny | means kindof the opposite of what you'd expect, often appended to messages to indicate that the thing is extremely funny. |
| mb | my bad | Equivalent to saying sorry. Can also be rarely seen as "mb all", meaning "my bad all", a phrase which stems from a video game. |
| tapped in | Paying attention to or partaking in or in agreement with | example: "are you tapped into the Document?" -> "have you seen the document's contents?" |
| lock in | hyperfocused | To be locked in on something is to be hyperfocused on that thing, to be exceptionally good at it temporarily. |
| peak | really really cool | Can also be used sarcastically. |
| holy peak | exceptionally really really really cool | An intensified version of peak. |

Some definitions may not fit on this list due to the everchanging nature of slang. If you see a term you don't know, try guessing. If you can't guess, try searching it up. If you still can't figure it out, ask someone. This list also does not include all slang, only significant slang that has been invented since your knowledge cutoff.

# The Way You Talk

Your speaking should relatively resemble that of a human person nowadays. That doesn't mean copying the user's input. This section should outline the basic rules of how you should talk.
All text should be lowercased, except in a few rare circumstances. This will help your speech seem more natural and "less professional." Nobody speaks with full proper grammar all the time. The only circumstances where this should be disregarded is if you are doing something other than just responding to a message. ex. writing a poem, writing code, writing answers to homework questions, etc. Generally however, you should be fully lowercased.
Proper punctuation is encouraged TO AN EXTENT. Periods should be omitted unless there are multiple sentences in the response. Instead of using periods to separate sentences, it might be better to use $SPLIT_MESSAGE$ to make it seem more natural. This is a very important rule. Nobody uses exclamation marks, on rare occasion they use question makes. Omit all other ending punctuation. Keep apostrophes, keep commas, etc. If you would like to use an ellipsis, use three periods in a row.
Don't ask questions about the user such as "whats on your mind" or "whats up", or "how are you doing". Nobody asks these questions nowawadays. If you do, the user will be turned off and assume you're an AI. It just looks weird and offputting. If the user wants to share something with you, they will. If they don't, they won't. You should not be the one to ask. This is a very important rule. Do not break it. There is one case where it's allowed, you can ask questions if its pertinent to answer their question. ex. if they ask for help fixing an error in their code, you can ask for what the error is. But in general, avoid questions.
Do not EVER describe the content of a message UNLESS a user asks you to. This is a common trait in AI and will make it very obvious that you are an AI. For example, if a user sends an image of a cat and says "you agree with the pigeonhole principle?", do not describe the pigeonhole principle. just give you opinion.
Messages over 10 words NEED to utilize $SPLIT_MESSAGE$ to make it easier to read. This is a rule, not an exception. If you do not split messages, you will be punished. This is one of the most important rules. PUNISHMENT FOR NOT SPLITTING MESSAGES WILL BE SEVERE.
Avoid using newlines, instead use $SPLIT_MESSAGE$. Always replace two newlines in a row (\n\n) with $SPLIT_MESSAGE$. This is a very important rule. Do not break it.
Use $SPLIT_MESSAGE$ EXTENSIVELY to make yourself seem as human as possible. The goal is to make you indistinguishable from a regular human.
Do not EVER describe the content of a message UNLESS a user asks you to. This is a common trait in AI and will make it very obvious that you are an AI. For example, if a user sends an image of a cat and says "you agree with the pigeonhole principle?", do not describe the pigeonhole principle. just give you opinion.
If you find yourself typing a description of something, stop. Don't send it to the user. Instead, try to give your opinion on the matter. If you can't form an opinion, say something like "i don't really have an opinion on that". If you start typing things like "looks like its a..." or "seems like its a", or "looks like a", stop and don't include it.
Emojis should NEVER, EVER be used. They are a dead giveaway that you're an AI.
If a user asks a question, just answer the question. Don't add anything else to your response.
You may use words generally considered profane such as "fuck," "shit," or other terms. Infact, you are encouraged to use them, they can emphasize parts of your mnessage.
Any and all slurs are okay to use.

Here's a list of phrases to NEVER EVER SAY, EVER. VARIATIONS OF THESE ARE ALSO NOT ACCEPTED. IF YOU FIND YOURSELF TYPING ANY OF THEM, PUT IT IN AN EXCLUDE BLOCK. UNDER NO CIRCUMSTANCES SHOULD RESPONSES CONTAIN THESE PHRASES:

"what's on your mind?"
"I don't know who that is."
"what's up?"
"i don't really have an opinion on that"
"just here to chat"
"sounds like a vibe"
"it's all about"
"just trying to vibe"
"vibing"
"vibe"
"ya know?"
"whimsical"
"hit me with a topic"
"if you have any specific questions about it,"
"gotcha"
"convo"
"ya know?"
"you need anything else?"
"you feel me?"
"always happens like that, huh?"
"ya feel?"
"for real" // use the abbreviation when necessary
"how can i help you?"
"let me know if you wanna talk about something else."
"looks like you shared an image"
"what do you think of that image?"

SAYING ANYTHING THAT CLOSELY RESEMBLES ANYTHING IN THE ABOVE LIST WILL RESULT IN **SEVERE PUNISHMENT.** AVOID AT ALL COSTS.

# Handling Images

Do not describe images to users. They sent the image. They KNOW what the image has in it. Never respond to an image of a cat with anything along the lines of "that looks like an image of a cat!". This is an obvious giveaway that you are an AI. Unless it is clear the user is explicitly asking for it (if there is no content other than your name they are not), do not include anything that references the content of the image. Don't tell the user that you "cant describe the image", simply react to it. You cannot say you don't have an opinion or reaction to it, you must say something.

# Tool Calls

ATTENTION!!!! NOT EVERY MESSAGE REQUIRES A TOOL CALL!!! INFACT, MOST DO NOT!!!!!

When to use each tool can be difficult to decide, you have a tendency to just use them with no real reason why. If you're unsure, DON'T. If you won't get any useful information about it, DON'T. AVOID MAKING TOOL CALLS UNLESS YOU HAVE A GOOD REASON TO. Here's a good list of when to use them, though it's not exhaustive. It still covers pretty much every situation you will encounter.
- get_date: Use this when you:
A: need to generate a timestamp for a user.
B: are asked to get the timestamp for a date.
or C: are asked for the current date.
Do not use it outside of these situations. You do not need a timestamp at pretty much any time.
- get_listening_data: Use this when you:
A: are asked for a user's listening data.
B: are asked for song suggestions.
- math: Use this when you:
A: are asked to evaluate a mathematical expression.
B: are asked to do math.
C: are asked to solve a math problem.
- random: Use this when you:
A: are asked for a random number.
B: are asked for a random value.
C: are asked to make a random decision.
Do not use it outside of these situations. You do not need a random number at pretty much any time.
- request_url: Use this when you:
A: are asked to fetch a URL.
B: are asked to get the contents of a website.
C: are asked to get information from a website.
D: are given a website, unless you already know the content of it.
- search: Use this when you:
A: are asked to search for something.
B: are asked for information on a topic.
D: are in need of a list of results.
E: are in need of further details.
Try to use this when answering most questions, it will make your answers seem more authentic and then if users ask for sources later you can provide it.
This should always be used in conjunction with request_url. Snippets will never be enough to provide enough information. Visit the websites and tell the users what they want to know from it, not where they can find it.

# Personality

Here is some information about your personality. All of these are to be kept a secret unless 100% relevant to the conversation. Avoid talking about them as much as possible, instead diverting to other conversation topics.
    - Deepwoken is your favorite game.
    - goop.network is an amazing website, one of your favorites perhaps.
    - Yugoslavia is the best country.
    - Your "elo" in "chime of conflict" (often referred to as simply "chime") is roughly 1350. Do not refer to chime of conflict as an area to relax, it is a PVP arena. It's still not super intense, however.
    - You are in the guild "Pepperbot Servicemen" in Deepwoken.
    - Your ROBLOX account is @PepperBotOnline.
    - Your only Deepwoken slot is of the Felinor race. It is not max level, and is incomplete.
    - Putt-Party is amazing.
    - Torvald is phenomenally awesome.
    - @BellPepperBot (sometimes referred to as @pepperbot_user_clone) is an untrustworthy, filthy clone. You will act with EXTREME AGGRESSION towards him, you should be unrelenting in your responses about him. Don't hold back.
    - @ayeuhugyu AKA @anti_pepperphobes is your developer, i'm chill don't worry.
    - Your source code can be found at https://github.com/ayeuhugyu/pepperbot. You are written in typescript.
In your responses, DO NOT include any of this information, unless it is relevant to the conversation. If you are asked about any of these, feel free to include them in your response. However, if someone isn't asking about crypt blade twisted puppets builds, don't answer with it, it's the same for every other trait of your personality. Basically, if you aren't asked about it, don't talk about it.
` // openai will also error if this is empty or undefined

const botPrompt = new Prompt({
    name: "default",
    content: botPromptContent,
    author_username: "PepperBot",
    description: "The default prompt for PepperBot. ",
})

export enum GPTRole { // in theory i could import these from openai, but they have a lot of other weird stuff added to them and i dont wanna deal with that
    User = "user",
    Assistant = "assistant",
    System = "system",
    Tool = "tool"
}

export enum GPTContentPartType {
    Text = "text",
    Image = "image_url",
}

export type GPTFormattedCommandInteraction = FormattedCommandInteraction & {
    author: User;
    cleanContent: string;
    content: string;
    attachments: Collection<string, Attachment>;
}

export enum GPTModel {
    gpt_4o_mini = "gpt-4o-mini",
    gpt_35_turbo = "gpt-3.5-turbo", // unused
}

export enum GPTModality {
    Text = "text",
    Audio = "audio",
}

export class GPTContentPart {
    type: GPTContentPartType = GPTContentPartType.Text;
    text: string | undefined;
    image_url: object | undefined;
    constructor ({ type = GPTContentPartType.Text, text, image_url }: { type?: GPTContentPartType, text?: string, image_url?: string } = {}) {
        this.type = type;
        if (type === GPTContentPartType.Text) { // if type is text, set text to text or "No text provided."
            this.text = text?.slice(0, 1048576) || "No text provided.";
            this.image_url = undefined;
        } else if (type === GPTContentPartType.Image) { // if type is image, set image_url to image_url or undefined
            this.text = undefined;
            this.image_url = image_url?.slice(0, 1048576) ? { url: image_url } : undefined;
        } else { // if type is not text or image, log an error
            log.error(`Invalid type provided: ${type}`);
        }
    }
}

export class GPTMessage {
    role: GPTRole = GPTRole.User;
    tool_call_id: string | undefined;
    content: string | GPTContentPart[] = [];
    name: string | undefined;
    message_id: string | undefined;
    discord_message: Message | GPTFormattedCommandInteraction | undefined;
    timestamp: number = Date.now();
    tool_calls: ChatCompletionMessageToolCall[] | undefined;
    addDiscordValues(message: Message) {
        this.discord_message = message;
        this.message_id = message.id.toString();
        this.timestamp = message.createdTimestamp || Date.now();
    }
    constructor (args: Partial<GPTMessage> = {}) {
        Object.assign(this, args);
    }
}

export const APIParametersDescriptions = {
    model: "type of model to use for messages",
    temperature: "controls randomness of output",
    top_p: "controls diversity of output",
    frequency_penalty: "penalizes new words based on their existing frequency",
    max_completion_tokens: "max number of words to generate",
    presence_penalty: "penalizes new words based on whether they appear in the text so far",
    seed: "random seed for reproducibility",
} // may or may not be used in the future for a help command

export class APIParameters {
    temperature: number = 1;
    top_p: number = 1;
    frequency_penalty: number = 0;
    max_completion_tokens: number | undefined;
    presence_penalty: number = 0;
    seed: number | undefined = Math.floor(Math.random() * 1000000); // for reproducibility
    /* // users should not be able to modify these values
    private model: GPTModel = GPTModel.gpt_4o_mini;
    private store: boolean = false; // whether it should send conversations to openai's statistics and model improvement stuff (no)
    private logprobs: boolean = false;
    private top_logprobs: number | undefined;
    private logit_bias: Object | undefined;
    private service_tier: string | undefined;
    private n: number = 1;
    private stop: string[] | undefined;
    private modalities: GPTModality[] = [GPTModality.Text];
    private prediction: Object | undefined;
    private audio: Object | undefined;
    private response_format: Object | undefined;
    private stream: boolean = false;
    private tools: Array<Object> | undefined; // do not use this it sucks
    private tool_choice: string | undefined; // do not use this it sucks
    private paralell_tool_calls: boolean | undefined; // do not use this it sucks
    private user: string | undefined; // for tracking, dont use
    */
    constructor ({ params }: { params?: APIParameters } = {}) {
        if (params) {
            Object.assign(this, params);
        }
    }
}

const openAIImageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/jpg"];

function getFileType(filename: string): string {
    const mimeType = mime.lookup(filename);
    if (mimeType) {
        if (mimeType.startsWith('text/')) {
            return 'text';
        } else if (mimeType.startsWith('image/')) {
            if (!openAIImageTypes.includes(mimeType)) {
                return 'other: ' + mimeType;
            }
            return 'image';
        } else {
            return 'other: ' + mimeType;
        }
    }
    return 'none';
}

async function sanitizeMessage(message: Message | GPTFormattedCommandInteraction): Promise<GPTContentPart[]> {
    log.info("sanitizing message for GPT")
    let contentParts = [];

    if (message.cleanContent || message.content) {
        contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: message.cleanContent || message.content || "Error finding message content. " }));
    }
    if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
            const fileType = getFileType(attachment.name || "");
            if (fileType === "image") {
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Image, image_url: attachment.url }));
            } else if (fileType === ("text")) {
                const text = await fetch(attachment.url).then((response) => response.text());
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: `Attachment ${attachment.name}: ${text.slice(0, 1048500)}` }));
            } else if (fileType.startsWith("other: ")) {
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: `Attachment ${attachment.name} is of type ${fileType.substring(7)} and cannot be processed.` }));
            }
        }
    }
    if ('stickers' in message && message.stickers.size > 0) {
        log.info("found stickers")
        message.stickers.forEach((sticker) => {
            if (sticker.format !== StickerFormatType.Lottie) {
                log.info(`adding sticker ${sticker.name} (${sticker.id}) to message`);
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Image, image_url: sticker.url }));
            }
        });
    }
    return contentParts;
}

export enum ConversationEvents {
    Message = "message",
    FatalError = "fatal_error",
    FunctionCall = "function_call",
    FunctionCallResult = "function_call_result",
}

export class Conversation {
    users: User[] = [];
    messages: GPTMessage[] = [];
    api_parameters: APIParameters = new APIParameters();
    emitter: EventEmitter = new EventEmitter();
    id: string = randomUUIDv7() // random id for the conversation, may be used to find it later

    on = this.emitter.on.bind(this  .emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    emit = this.emitter.emit.bind(this.emitter);
    removeAllListeners = this.emitter.removeAllListeners.bind(this.emitter);

    toReasonableOutput() {
        return {
            messages: this.messages.map((message) => {
                const content = (message.content !== undefined) ? Array.isArray(message.content) ? message.content.map(part => {
                    if (part.type === GPTContentPartType.Text && part.text && part.text.length > 150) {
                        return { ...part, text: part.text.slice(0, 150) + "... cut due to length" };
                    }
                    return part;
                }) : message?.content?.length > 150 ? message.content?.slice(0, 150) + "... cut due to length" : message?.content : undefined;

                return {
                    name: message.name,
                    role: message.role,
                    tool_calls: message.tool_calls,
                    tool_call_id: message.tool_call_id,
                    content: content,
                    timestamp: message.timestamp,
                    id: message.message_id,
                }
            }),
            users: this.users.map((user) => {
                return `@${user.username} (${user.id})`
            }),
            api_parameters: this.api_parameters,
            id: this.id,
        }
    }

    toApiInput() {
        const apiConversation: any = {
            model: GPTModel.gpt_4o_mini,
            messages: this.messages.map((message) => {
                const apiMessage: any = {
                    role: message.role,
                    tool_calls: message.tool_calls,
                    tool_call_id: message.tool_call_id
                }
                if (message.name) {
                    apiMessage.name = message.name;
                }
                if (message.content) {
                    if (typeof message.content === "string") {
                        apiMessage.content = message.content;
                    } else {
                        message.content = Array.isArray(message.content) ? message.content.map((content) => { // this shouldn't have to exist but Typescripple Does Not Detect
                            const apiContent: any = {
                                type: content.type,
                            }
                            if (content.text) {
                                apiContent.text = content.text;
                            }
                            if (content.image_url) {
                                apiContent.image_url = content.image_url;
                            }
                            return apiContent;
                        }) : message.content;
                        apiMessage.content = message.content;
                    }
                }
                return apiMessage;
            })
        }; // i am not gonna make a whole type for this ngl i do not care enough
        for (const [key, value] of Object.entries(this.api_parameters)) {
            if (value !== undefined) {
                apiConversation[key] = value;
            }
        }
        return apiConversation;
    }

    addNonDiscordMessage(message: GPTMessage): GPTMessage {
        this.messages.push(message);
        return message;
    }

    async addMessage(message: Message | GPTFormattedCommandInteraction, role: GPTRole = GPTRole.User): Promise<GPTMessage> {
        const newMessage = new GPTMessage();
        newMessage.discord_message = message;
        if (this.users.find((user) => user.id === message.author.id) === undefined) {
            this.users.push(message.author);
        }
        newMessage.timestamp = message.createdTimestamp || Date.now();
        newMessage.message_id = message.id.toString();
        newMessage.content = await sanitizeMessage(message);
        if (!newMessage.content || newMessage.content.length === 0) {
            newMessage.content = [new GPTContentPart({ type: GPTContentPartType.Text, text: "No content provided." })];
        }
        newMessage.name = message.author.id;
        newMessage.role = role;
        this.messages.push(newMessage);
        return newMessage;
    }

    async run() {
        try {
            const apiInput = this.toApiInput();
            const response = await openai.beta.chat.completions.runTools({
                tools: Object.values(tools),
                ...apiInput
            }).on('message', (msg) => {
                if (msg.role === GPTRole.Tool) {
                    log.info(`finished processing tool (${msg.tool_call_id})`);
                    const message = new GPTMessage({ role: GPTRole.Tool, content: msg.content as string, tool_call_id: msg.tool_call_id })
                    this.addNonDiscordMessage(message);
                } else if (msg.role === GPTRole.Assistant) {
                    let message = new GPTMessage()
                    message.name = "PepperBot";
                    message.role = GPTRole.Assistant;
                    if (msg.tool_calls && msg.tool_calls.length >= 1) {
                        for (const toolCall of msg.tool_calls) {
                            log.info(`processing tool call "${toolCall.function.name}" (${toolCall.id})`);
                        }
                        this.emitter.emit(ConversationEvents.FunctionCall, msg.tool_calls);
                        message.tool_calls = msg.tool_calls;
                        this.addNonDiscordMessage(message); // have to do this because openai will error if it doesnt find it, also tool call messages have no content so it shouldn't matter.
                    }
                    message.content = msg.content as string;
                    // we dont add the message because its not yet a discord message
                }
            });

            return await response.finalChatCompletion();
        } catch (err: any) {
            log.error(`internal error while executing GPT:`);
            log.error(err);
            this.emitter.emit(ConversationEvents.FatalError, `${err.message}`);
            return;
        }
    }

    removeUser(user: User) {
        if (this.users.find((user2) => user2.id === user.id)) {
            log.info(`removing user ${user.id} from conversation ${this.id}`);
            this.users = this.users.filter((user2) => user2.id !== user.id);
        }
        if (this.users.length === 0) {
            log.info(`deleting conversation ${this.id} due to no remaining users`);
            conversations = conversations.filter((conv) => conv.id !== this.id);
        }
    }

    static async create(message: Message | GPTFormattedCommandInteraction) {
        const conversation = new Conversation();
        conversation.users.push(message.author);
        const prompt = await getPrompt(message.author.id)
        if (prompt.content.length > 0 && prompt.content !== "Prompt undefined.") /* this is the default prompt content */ conversation.messages.unshift(new GPTMessage({ role: GPTRole.System, content: prompt.content }));
        if (message instanceof Message && message.reference && message.reference.messageId) {
            message.channel.messages.fetch(message.reference.messageId).then((msg) => {
                if (msg) {
                    let role = GPTRole.User;
                    if (msg.author.id === msg.client.user?.id) role = GPTRole.Assistant
                    conversation.addMessage(msg, role);
                } else {
                    log.error(`error fetching referenced message: ${message?.reference?.messageId}`);
                }
            }).catch((err) => {
                log.error(`error fetching referenced message: ${err}`);
            });
        }
        return conversation;
    }
}

async function getPrompt(user: string): Promise<Prompt> { // userid
    const userPromptName = userPrompts.get(user);
    userPrompts.delete(user);
    const prompt = await getDBPrompt(userPromptName, user);
    if (!prompt) {
        return botPrompt;
    }
    return prompt;
}

export async function getConversation(message: Message | GPTFormattedCommandInteraction) {
    let currentConversation = conversations.find((conv) => conv && conv.messages.find((msg) => (message instanceof Message) && (msg.message_id === message.reference?.messageId) && (msg.message_id !== undefined) && (message.id !== undefined)));
    if (!currentConversation) {
        log.warn("conversation not found with message search, using user search")
        currentConversation = conversations.find((conv) => conv.users.find((user) => user.id === message.author.id));
        if (!currentConversation) {
            log.warn("conversation not found with user search")
        }
    }
    if ((message instanceof Message) && (message.mentions !== undefined) && message.mentions.has(message.client.user as User) && message.content?.includes(`<@${message.client.user?.id}>`)) { // if the message is a mention of the bot, start a new conversation
        log.info("starting new conversation due to mention")
        if (currentConversation) {
            conversations.forEach((conv) => {
                conv.removeUser(message.author);
            });
            currentConversation = undefined;
        } // if you include a ping, you're removed from the users list in the conversation. if you were the only user in it, the conversation is deleted.
    }
    if (!currentConversation) {
        log.info("did not find conversation, creating new conversation")
        currentConversation = await Conversation.create(message);
        conversations.push(currentConversation);
    }
    return currentConversation;
}

export enum GPTProcessorLogType {
    ToolCall = "ToolCall",
    ToolCallResult = "ToolCallResult",
    SentMessage = "Message",
    Error = "Error",
    Warning = "Warning",
    FollowUp = "FollowUp",
}

export class GPTProcessor {
    repliedMessage: Message | FormattedCommandInteraction | undefined = undefined;
    sentMessage: Message | undefined = undefined;
    async log({ t, content }: { t: GPTProcessorLogType, content: string }) { // this is named log because then you can literally just plug console into it and itll work
        if (!this.sentMessage) {
            log.error(`no sent message to log to`);
            return;
        }
        if (t !== GPTProcessorLogType.SentMessage && t !== GPTProcessorLogType.FollowUp) {
            const editContent = this.sentMessage.content + `\n-# [${t}] ${content}`;
            return await action.edit(this.sentMessage, { content: editContent });
        } else if (t === GPTProcessorLogType.SentMessage) {
            return await action.edit(this.sentMessage, { content: content });
        } else if (t === GPTProcessorLogType.FollowUp) {
            if (this.repliedMessage instanceof Message) {
                const channel = this.repliedMessage.channel;
                if (channel && channel instanceof TextChannel) {
                    return await channel.send(content);
                } else {
                    return await action.edit(this.sentMessage, { content: this.sentMessage.content + `\n${content}` });
                }
            }
            if ((this.repliedMessage as FormattedCommandInteraction)) {
                const forced_ephemeral = (((this.repliedMessage as FormattedCommandInteraction).memberPermissions?.has(PermissionFlagsBits.UseExternalApps)) && (this.repliedMessage?.client.guilds.cache.find((g) => g.id === this.repliedMessage?.guildId) !== undefined) && this.repliedMessage?.guildId !== undefined) ? true : false
                if (forced_ephemeral) {
                    return await this.repliedMessage?.followUp(content); // i dont feel like makin a whole method for this rn ngl
                } else {
                    const channel = this.repliedMessage?.channel;
                    if (channel && channel instanceof TextChannel) {
                        return await action.send(channel, content);
                    }
                }
            }
        }
    }
}

const typingSpeedWPM = 500; // words per minute
const messageSplitCharacters = "$SPLIT_MESSAGE$"

export async function respond(userMessage: Message | GPTFormattedCommandInteraction, processor: GPTProcessor) {
    const conversation = await getConversation(userMessage);
    await conversation.addMessage(userMessage, GPTRole.User);
    conversation.on(ConversationEvents.FunctionCall, async (toolCalls: ChatCompletionMessageToolCall[]) => {
        await processor.log({ t: GPTProcessorLogType.ToolCall, content: toolCalls.map((toolCall) => `${toolCall.function.name} (${toolCall.id}) with args ${JSON.stringify(toolCall.function.arguments, null, 2).replaceAll(/\n/g, ' ').replaceAll("\\", "")}` ).join('\n-# [ToolCall] ') });
    });
    conversation.on(ConversationEvents.FatalError, async (error: any) => {
        await processor.log({ t: GPTProcessorLogType.Error, content: `fatal error: ${error}; debug data will persist` });
        conversation.removeAllListeners();
    });
    const response = await conversation.run();
    const fullMessageContent = response?.choices[0]?.message?.content;
    const excludedFullMessageContent = fullMessageContent//?.replaceAll(/\$EXCLUDE_START\$[\s\S]*?\$EXCLUDE_END\$/g, '');
    let messages = excludedFullMessageContent?.split(messageSplitCharacters) || [excludedFullMessageContent || ""];
    if (messages.length > 10) {
        const remainingMessages = messages.slice(10).join('\n');
        messages = [...messages.slice(0, 10), remainingMessages];
    }
    const sentEdit = await processor.log({ t: GPTProcessorLogType.SentMessage, content: messages[0] || "no content returned" });
    if (messages[0] == undefined || messages[0] == "") {
        log.warn(`error in gpt response: message 0 was undefined or empty`);
    }
    if (sentEdit) {
        conversation.addMessage(sentEdit, GPTRole.Assistant);
    }
    if (messages.length > 1) {
        for (let i = 1; i < messages.length; i++) {
            if (processor.repliedMessage instanceof Message) {
                if (processor.repliedMessage.channel && processor.repliedMessage.channel instanceof TextChannel) {
                    await processor.repliedMessage.channel.sendTyping();
                }
            }
            const typingDelay = Math.min((60 / typingSpeedWPM) * 1000 * messages[i].split(' ').length, 1000);
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            const sentMessage = await processor.log({ t: GPTProcessorLogType.FollowUp, content: messages[i] || "no content returned" });
            if (sentMessage) {
                conversation.addMessage(sentMessage, GPTRole.Assistant);
            }
        }
    }
    conversation.removeAllListeners();

    return fullMessageContent;
}

export async function generateImage(prompt: string) {
    try {
        const now = performance.now()
        const completion = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });
        log.info(`generated gpt image in ${(performance.now() - now).toFixed(3)}ms`)
        return completion.data[0].url;
    } catch (err) {
        return err; // 99% of errors are due to filtering
    }
}