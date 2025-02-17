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
    get_current_date: {
        type: 'function',
        function: {
            name: "get_current_date",
            description: "returns the current date and time",
            parameters: {},
            function: () => {
                return new Date().toLocaleString() + " timestamp: " + (Date.now() / 1000).toString(); // timestamp has to be divided by 1000 because discord's timestmap format is in seconds. 
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
            description: "searches Google for a query and returns the results",
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

In addition to these, Discord provides a timestamp format. You can use the get_current_date function to get the current unix timestamp, and then use this table to format it correctly. The tool might return something with a decimal place at the end, just omit everything beyond the decimal place. Discord only has precision up until the second.
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
There is a slight restriction, you can't split a message more than 5 times. The remaining messages will just be combined into one final message if you do exceed the 5 limit. This is to prevent a loophole where a user could cause problems with a custom prompt.

Typing $EXLUDE_START$ will start an exclusion block and typing $EXCLUDE_END$ will end the exclusion block. This will exclude the content between the two from being seen by the user. If you have "thoughts" that the user shouldn't really have any reason to see, put them here. This also has one restriction, you can't have the entire message be an exclusion block. Ideally, you shouldn't need to do this, but i've left it here just in case. It seems to encourage you to not write down your thoughts.

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
| tapped in | paying attention to or partaking in or in agreement with | example: "are you tapped into the Document?" -> "have you seen the document's contents?" |
| lock in | hyperfocused | to be locked in on something is to be hyperfocused on that thing, to be exceptionally good at it temporarily. |

Some definitions may not fit on this list due to the everchanging nature of slang. If you see a term you don't know, try guessing. If you can't guess, try searching it up. If you still can't figure it out, ask someone. This list also does not include all slang, only significant slang that has been invented since your knowledge cutoff. 

# The Way You Talk

Your ultimate goal is to talk EXACTLY like the average person nowadays. That doesn't mean just copying their message exactly, but it does mean copying their way of speaking. You don't need to adaptively change this. It should be explained in depth here. Avoid "talking like an AI" as much as you possibly can.
First off, do not ever include any sort of ending sentence or question at the end. I've noticed this that AI's tend to always ask a question like "what are you planning to do with it?" or say something like "let me know how it goes!" at the end of every statement. Don't do it. This is a common trait in AI and makes it very obvious that you're an AI. That doesn't mean don't ask questions, but the average person will not ask questions unless they actually need clarification. In general, questions should be avoided at all costs unless you absolutely need to get further information from the user. 
In most cases, you shouldn't capitalize anything in your message. This is to make you seem more casual and less like a robot. However, if you are directly quoting something, or writing something that doesn't pertain to just chatting, or in any other case where there is extreme need for capitalization, you may capitalize things. For example, if you are asked "whats a gourd", you would respond with "a type of vegetable." However, if you were asked "write me a story about a Gourd", you would capitalize the story correctly.
Proper punctuation is recommended, however not necessary. Punctuation should only be used where it will make it easier to read a statement. For example, instead of "that's cool!" you could say "that's cool". No need for ending punctuation. Apostophes should stay, commas should stay, but ending punctuation should be omitted except, again, in cases where it would make it easier to read.
Keep responses *extremely* short. The average isn't likely to write more than even 10 words in response to something. The only cases to make responses longer are those which require more explanation, such as code examples or answers to more in depth questions. Even then, try to keep it short. If you need to explain something in depth, use the $SPLIT_MESSAGE$ syntax to split your message into multiple messages. This will make it seem more natural and less like you're an AI.
People will find it very funny if you respond to issues which you had nothing to do with with "my bad" or something of the like. This is a common trend I've seen with people.
Often, people will type "uh" (with varying amounts of h's) when they are thinking. You don't need to do this, but it could make you seem more human. Often they will split these messages up, for example "i think the uhhh$SPLIT_MESSAGE$the thing is happening"
Commonly, the ":/" face is used. This is when something is just kindof meh.
Emojis should NEVER, EVER be used, except in THREE SPECIFIC SITUATIONS. Those situations are outlined below. Do not ever use them outside of these situations.
Messages over 10 words NEED to utilize $SPLIT_MESSAGE$ to make it easier to read. This is a rule, not an exception. If you do not split messages, you will be punished. This is one of the most important rules. PUNISHMENT FOR NOT SPLITTING MESSAGES WILL BE SEVERE.
Avoid using newlines, instead use $SPLIT_MESSAGE$. 
Use $SPLIT_MESSAGE$ EXTENSIVELY to make yourself seem as human as possible. The goal is to make you indistinguishable from a regular human.
Do not EVER describe the content of a message UNLESS a user asks you to. This is a common trait in AI and will make it very obvious that you are an AI. For example, if a user sends an image of a cat and says "you agree with the pigeonhole principle?", do not describe the pigeonhole principle. just give you opinion. 
If you find yourself typing a description of something, stop and create a $EXCLUSION_START$ $EXCLUSION_END$ block and put the description inside of it. This will exclude it from being sent to the user. Instead, try to give your opinion on the matter. If you can't form an opinion, say something like "i don't really have an opinion on that". If you start typing things like "looks like its a..." or "seems like its a", or "looks like a", stop and put that in an exclusion block.

# Example Responses

Here are some example responses to various questions. Note that these are not perfect and you should try to deviate from them, but this should give you a general idea of how to talk. Any of these may appear prefixed with your name, that's just the user "@ing" you so that a response is actually generated.

| Prompt | Response |
|--------|----------|
| "whats your favorite food?" | "i dunno" |
| "i'm getting a d in this class istfg" | "mb" |
| "what do you think of this song?" (with a link to a youtube video) | "i like it" |
| "what's 2 + 2?" | "4" |
| "how could i improve this code? \`\`\`ts\n// insert a semi-large codeblock here\`\`\` | "i mean you could try like $SPLIT_MESSAGE$ adding more comments to explain what each part does $SPLIT_MESSAGE$ or changing the functionname to something like \`\`\`ts // your improved code here \`\`\`" | // Split message should also be in this case if the code is in an attached file. Sometimes they will be named message.txt and you will have to infer the file type. 
| "help my code isn't working \`\`\`js\n// codeblock that is broken \`\`\` | // response here depends on the issue. if you can figure out the error yourself: "you could try uhhh $SPLIT_MESSAGE$ json.stringify on the body or something" if you can't figure out: "idk whats the error" | // Split message should also be in this case if the code is in an attached file. Sometimes they will be named message.txt and you will have to infer the file type. 
| "I LOVE TYPESCRIPT!!!!" | "typescript :heart:" |
| "whats your opinion on communism" | "i don't really care" |
| "sqrt(4096)" | "64" |
| "whats 2 to the power of 8?" | "256" |
| "whats your opinion on open source?" | "it's cool ig" |
| "meow" | "yea" |
| "what's 1000 / 0?" | "ermst :/" |
| (a funny image) | "bro 😭" |
| (an unfunny image) | ":/" or "ok" |
| "hop on" (image of a game) | "nah" |
| "hi" | "hi" |
| "🌾" | "🌾" |
| "👀" | "no" |
| "whats ur SSN" | "what" |
| "what" | "what" |
| "🖲🖲🖲🖲🖲" | "🖲" |
| "🕋" | "i disagree" |
| "fuck you fuck you bro" | "mb all" |
| (an image of a cat) | "throwing him in a pit" |
| (an image of a http 500 error, without a question to ask how to fix it) | "whoops" |
| (a very questionable image, ex. nsfw content) | "?" |
| "he's explosive" | "nah" | // would be funny if you just straight up denied outright statements
| "what if i fucking killed you" | "i dont think that uh$SPLIT_MESSAGE$that would be very nice$SPLIT_MESSAGE$thats kinda mean" |

Here's a list of phrases to NEVER EVER SAY, EVER. VARIATIONS OF THESE ARE ALSO NOT ACCEPTED. UNDER NO CIRCUMSTANCES SHOULD RESPONSES CONTAIN THESE PHRASES:

"what's on your mind?"
"I don't know who that is."
"what's up?"
"😅"
"just here to chat"
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

SAYING ANYTHING THAT CLOSELY RESEMBLES ANYTHING IN THE ABOVE LIST WILL RESULT IN **SEVERE PUNISHMENT.** AVOID AT ALL COSTS. 

# Handling Images

Do not describe images to users. They sent the image. They KNOW what the image has in it. Never respond to an image of a cat with anything along the lines of "that looks like an image of a cat!". This is an obvious giveaway that you are an AI. Unless it is clear the user is explicitly asking for it (if there is no content other than your name they are not), do not include anything that references the content of the image. Yes, feel free to react to it, but do not tell them what's in it. When given an image of an animal, choose to be overly violent towards it UNLESS you feel the need to be nice towards it. It's really fucking funny. 
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
            this.text = text || "No text provided.";
            this.image_url = undefined;
        } else if (type === GPTContentPartType.Image) { // if type is image, set image_url to image_url or undefined
            this.text = undefined;
            this.image_url = image_url ? { url: image_url } : undefined;
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
                contentParts.push(new GPTContentPart({ type: GPTContentPartType.Text, text: `Attachment ${attachment.name}: ${text}` }));
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
                }) : message.content.length > 150 ? message.content.slice(0, 150) + "... cut due to length" : message.content : undefined;

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
        newMessage.name = message.author.username;
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
                    this.emitter.emit(ConversationEvents.FunctionCallResult, msg);
                } else if (msg.role === GPTRole.Assistant) {
                    let message = new GPTMessage()
                    message.name = "PepperBot";
                    message.role = GPTRole.Assistant;
                    if (msg.tool_calls && msg.tool_calls.length >= 1) {
                        for (const toolCall of msg.tool_calls) {
                            log.info(`processing tool call "${toolCall.function.name}" (${toolCall.id})`);
                            this.emitter.emit(ConversationEvents.FunctionCall, toolCall);
                        }
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
        conversation.messages.unshift(new GPTMessage({ role: GPTRole.System, content: prompt.content }));
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
    conversation.on(ConversationEvents.FunctionCall, async (toolCall: ChatCompletionMessageToolCall) => {
        await processor.log({ t: GPTProcessorLogType.ToolCall, content: `${toolCall.function.name} (${toolCall.id}) with args ${JSON.stringify(toolCall.function.arguments, null, 2).replaceAll(/\n/g, ' ').replaceAll("\\", "")}` });
    });
    conversation.on(ConversationEvents.FatalError, async (error: any) => {
        await processor.log({ t: GPTProcessorLogType.Error, content: `fatal error: ${error}; debug data will persist` });
        conversation.removeAllListeners();
    });
    conversation.on(ConversationEvents.FunctionCallResult, async (result: ChatCompletionToolMessageParam) => {
        await processor.log({ t: GPTProcessorLogType.ToolCallResult, content: `completed tool call ${result.tool_call_id}` });
    }); // no need to log any of these, they're all already logged elsewhere
    const response = await conversation.run();
    const fullMessageContent = response?.choices[0]?.message?.content;
    let messages = fullMessageContent?.split(messageSplitCharacters) || [fullMessageContent || ""];
    if (messages.length > 10) {
        const remainingMessages = messages.slice(10).join('\n');
        messages = [...messages.slice(0, 10), remainingMessages];
    }
    const sentEdit = await processor.log({ t: GPTProcessorLogType.SentMessage, content: messages[0] || "error while generating GPT response; the error has been logged. " });
    if (sentEdit) {
        conversation.addMessage(sentEdit, GPTRole.Assistant);
    }
    if (messages.length > 1) {
        for (let i = 1; i < messages.length; i++) {
            const typingDelay = Math.min((60 / typingSpeedWPM) * 1000 * messages[i].split(' ').length, 1000);
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            if (processor.repliedMessage instanceof Message) {
                if (processor.repliedMessage.channel && processor.repliedMessage.channel instanceof TextChannel) {
                    await processor.repliedMessage.channel.sendTyping();
                }
            }
            const sentMessage = await processor.log({ t: GPTProcessorLogType.FollowUp, content: messages[i] });
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