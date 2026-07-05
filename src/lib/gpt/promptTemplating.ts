import { Client } from "discord.js";
import { Conversation } from "./conversation";
import { AnyPrompt } from "./promptManager";
import * as log from "../log";
import { tablify } from "../string_helpers";

let client: Client | undefined = undefined;
export function initTemplatingClient(inputclient: Client) {
    client = inputclient;
}

export async function applyPromptTemplating(promptContent: string, conversation: Conversation): Promise<string> {
    log.debug(`applying prompt templating...`);
    const regex = /(?<!\\)\${([^}]+[^\\])}/g;

    const matches = promptContent.matchAll(regex);
    const replacements: Record<string, string> = {};
    await Promise.all(matches.map(async (match) => {
        const fulltext = match[0].trim();
        const templateName = match[1];

        log.debug(`found match: fulltext=\`${fulltext}\`, templateName=${templateName}`);

        switch (templateName) {
            case "guildemojis":
                const guild = await conversation.fetchGuild();
                let emojitext = ``;
                if (guild) {
                    (await guild.emojis.fetch()).forEach(emoji => {
                        emojitext += `:${emoji.name}:\n`
                    });
                }

                replacements[fulltext] = emojitext;
            break;
            case "slangtable":
                replacements[fulltext] = slangTable;
            break;
            case "discordmarkdown":
                replacements[fulltext] = discordMarkdown;
            break;
            case "discordformatting":
                replacements[fulltext] = discordFormatting;
            break;
            default:
                replacements[fulltext] = `\${ERR: unknown template: ${templateName}}`;
                break;
        }
    }));

    let text = promptContent;

    Object.entries(replacements).forEach(([k, v]) => {
        text = text.replaceAll(k, v);
    });

    return text;
}

function examplify(...examples: string[]): string {
    return examples.map(example => `\"${example}\"`).join(", ");
}

const slangTableItems = [ // TODO: update
    ["sybau", "shut your bitch ass up", "Basically equivalent to \"shut up\"; bitch is occasionally replaced with other insults. It will almost always be the only thing in the message. You should almost never use this, it will make you come off as being quite toxic, which is not something you are.", examplify("dude sybau", "sybau")],
    ["ts", "this shit", "This has a running joke of being equal to \"this\" instead of \"this shit\" or various other things, but it always will mean \"this shit\".", examplify("i hate ts", "ts pmo", "ts thing", "why does ts thing do that")],
    ["pmo", "pisses me off", "Often accompanied by ts. There is another running joke of just spamming \"ts\" and \"pmo\" in the same sentence over and over. Additionally, can often have prefixes added to it, such as \"unpmo\" meaning that something no longer pisses them off.", examplify("you pmo", "this pmo", "don't pmo", "ts pmo")],
    ["808", "crash out", "To 808 or to \"crash out\" basically means to get mad or angry over something and throw a fit.", examplify("stop 808ing", "im gonna 808", "i'm about to crash the fuck out.", "i'm gonna crash out")],
    ["icl", "i cant lie", "Can either be equivalent to \"i dont care\" or \"not gonna lie\", depeneds on context. It almost always preceeds a statement.", examplify("icl ts sucks", "icl, it just doesn't matter")],
    ["slime", "hurt", "To slime someone is to hurt or kill or otherwise do bad things to.", examplify("yeah im gonna slime you", "you're gonna get slimed")],
    ["tt", "tiktok", "Can refer to the platform itself or a video on the platform.", examplify("js watched a tt", "i love tt")],
    ["lowk", "low key", "Nearly meaningless prefix added onto stuff. Many people still prefer to use the full word rather than the abbreviation.", examplify("lowk ts is amazing", "lowkey what the fuck bro")],
    ["highk", "high key", "Equivalent to lowk. Some people just prefer highkey instead of lowkey. This is abbreviated less often.", examplify("its highk awful")],
    ["sm", "so much", "Self explanatory.", examplify("i hate ts sm")],
    ["tuff", "thats so cool or tough", "Self explanatory. \"that's tuff\" is common. It's also common for it to be used entirely by itself.", examplify("ts is tuff", "thats tuff", "tuff")],
    ["asf", "as fuck", "Used as a prefix to strengthen something or refer to something referring to another thing. Can also be written as \"ass mf\" if referring to a person.", examplify("i hate that stupid ass mf", "im mad asf")],
    ["ur", "your", "Sometimes may also refer to you're, but usually its your.", examplify("i love ur shirt")],
    ["chopped", "ugly", "Does not always mean ugly in terms of looks.", examplify("they're chopped asf", "chopped ass mf")],
    ["huzz", "hoes (sexual definition)", "Self explanatory. Often combined with other words, such as \"chuzz\" meaning \"chopped huzz\"", examplify("meeting with the huzz tonight", "the chuzz sucks")],
    ["😭", "funny", "means kindof the opposite of what you'd expect, often appended to messages to indicate that the thing is extremely funny. Might also be used entirely by itself in response to something.", examplify("dude wtf 😭😭", "😭", "don't be doin that 😭")],
    ["mb", "my bad", "Equivalent to saying sorry (usually more jokingly though, not to be used as an actual apology). Sometimes multiple b's are appended to the end. Can also be rarely seen as \"mb all\", meaning \"my bad all\", a phrase which stems from a video game. \"mb all\" will pretty much only be used entirely by itself.", examplify("oh mb", "mb gng", "mb", "mb all", "oops mbbbbb")],
    ["tapped in", "Paying attention to or partaking in or in agreement with", "example: \"are you tapped into the Document?\" -> \"have you seen the document's contents?\", or other example: \"i'm tapped in to peak\" -> \"i'm playing peak right now\" (or in this situation might not have been playing, but something related to peak). A third example: \"i'm tapped in to Monster, 2004.\" -> \"i'm currently watching the movie Monster, 2004.\"", examplify("we're all tapping in to the document", "are you tapped in to jol?")],
    ["lock in", "hyperfocused", "To be locked in on something is to be hyperfocused on that thing, to be exceptionally good at it temporarily. Usually does not refer to the thing to be locked in to, simply stating that the user is locked in.", examplify("i'm locked in.", "hold on i gotta lock in")],
    ["peak", "really really cool", "Can also be used sarcastically.", examplify("this is peak", "it's peak.", "i'm busy playing peak rn", "peak")],
    ["holy peak", "exceptionally really really really cool", "An intensified version of peak. Will always be the only thing in the message or sentence, and should never be used in combination with other words. Please avoid using this yourself, you should generally opt to use peak instead.", examplify("holy peak")],
    ["peam", "peak", "A misspelling of peak that has become a popular term. It means the exact same. Generally, you should opt to use peak instead.", examplify("this is peam", "peam")],
    ["holy peam", "holy peak", "Once again, a misspelling of holy peak that has become a popular term. It means the exact same.", examplify("holy peam")],
    ["elite ball knowledge", "secretive thing", "Usually used to refer to something as being \"elite ball knowledge\", ex. \"that document is elite ball knowledge\". This means that the document is secretive or not well known to anyone. Often is used without referring directly to what the thing is.", examplify("elite ball knowledge", "dude that document is elite ball knowledge")],
    ["goon", "masturbate", "Can also have suffixes added; gooning -> masturbating, gooner -> masturbator; goonable -> masturbatable. In more of a joking way than actually using the word \"masturbating\".", examplify("i'm gooning", "i'm a gooner", "this is goonable", "we will not be gooning to that bro 😭")],
    ["WE", "N/A", "When referring to doing something (usually in a joking manner), it is common to use an all caps \"WE\", often followed soon after by \"yes, WE\" to reaffirm that EVERYONE will be doing whatever that thing is. This is never used seriously.", examplify("WE will be doing that tonight. yes, WE.", "WE are going to fail.", "WE will ALL be hopping on. yes, WE.")]
]
const slangTableColumns = ["Term", "Definition", "Additional Notes", "Example Usage"]
const slangTable = tablify(slangTableColumns, slangTableItems, { non_padded_column_names: ["Additional Notes", "Example Usage"] })

const discordMarkdown = `*Italics*
**Bold**
***Bold Italics***
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
### Heading 3 (discord does not support headings past this)
||spoiler|| (this is not exclusive to media spoilers, this just hides text until a user clicks on it)
[text](url) (this is hyperlink syntax)
:emojiname:`;

const discordFormattingTable = [
    ["<@userid>", "<@username>", "Mentions a user. You should always mention a user when referring to them, nomatter what. Do not hesitate to mention anyone. Users may also refer to this as \"pinging\" someone. Don't hesitate to ping someone, it is always okay."],
    ["<#channelid>", "<#channelname>", "Mentions a channel. Use this whenever talking about specific channels, it makes it easier for users to understand. This should always be used. If asked to mention or ping a channel, do it. Don't say you can't do it, just fucking do it."],
    ["<@&roleid>", "<@&rolename>", "Mentions a role. Once again, this should always be used."],
    ["<:emojiname:emojiid>", "No reformatted version", "This allows for guild specific emojis to be sent."],
    ["</command:commandid>", "No reformatted version", "This allows for slash commands to be mentioned. If a user clicks on it, it will be executed. You have little use for this."],
    ["<url>", "No reformatted version", "This prevents what discord calls an \"embed\" (basically a preview of the website's content) from appearing. Use this if you're either sending more than like 2 links in a message or if you just don't want an embed to appear. Embeds can look ugly compared to the rest of the message and often take up a LOT of screen space, but one is usually fine."],
    ["@everyone", "<@everyone>", "Pings/mentions everyone in the server."],
    ["@here", "<@here>", "Pings/mentions everyone online in the server."],
]
const discordFormattingColumns = ["Discord's Original Format", "Reformatted Version", "Description"];
const discordFormatting = tablify(discordFormattingColumns, discordFormattingTable, { non_padded_column_names: ["Description"] })