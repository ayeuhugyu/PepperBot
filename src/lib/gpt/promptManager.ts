import { Client, ClientUser, User } from "discord.js"
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes";
import { ToolName, tools } from "./tools";
import { AnyTool, CustomTool, Tool } from "./toolTypes";
import z from "zod";
import { OmitMethods } from "../omitMethods";
import gpt41Nano from "./models/gpt-4.1-nano";
import { models } from "./models";
import * as log from "../log";
import { Mutex } from "async-mutex";
import database, { DBPrompt } from "../data_manager";

const boolSchema = z.preprocess((val) => {
    if (typeof val === "boolean") return val;

    if (typeof val === "number") return val === 1;

    if (typeof val === "string") {
        const s = val.trim().toLowerCase();
        if (["true", "1", "yes", "y", "on"].includes(s)) return true;
        if (["false", "0", "no", "n", "off", ""].includes(s)) return false;
    }

    return val;
}, z.boolean("value must be a boolean (true/false)"));

export const promptParameterTypings = { // no need to remake this type just because this isn't a model, it'd be the exact same
    "processingType": {
        key: "processingType",
        description: "changes how the \"processing...\" message behaves. \n- `default` will cause it to do as normal, send a message containing \"processing...\" until it finishes. \n- `typing` will cause the bot to show as typing in the channel until it finishes, without sending any message. \n- `none` will disable the processing message entirely.",
        schema: z.enum(["default", "typing", "none"], "value must be either `default`, `typing`, or `none`").default("default"),
    },
    "IOReplacements": {
        key: "IOReplacements",
        description: "whether or not to enable the input / output replacements. when true (default), user, channel, and role mentions will be replaced with their actual names instead of their id's. when false, they will be left untouched. note that the bot will still have mass pings (@everyone, @here, and all role mentions) replaced, assuming the server was not configured otherwise.",
        schema: boolSchema.default(false),
    },
    "enableTemplating": {
        key: "enableTemplating",
        description: "whether or not to enable prompt templating. these are automatic content replacements which can be applied in prompt content by typing ${templatename}. they will then be rendered upon conversation execution.",
        schema: boolSchema.default(false),
    }
}

export const defaultPromptParameters: InferModelParameters<typeof promptParameterTypings> = {
    processingType: "default",
    IOReplacements: true,
    enableTemplating: false,
}

type PromptInput = OmitMethods<Prompt<AnyModel, boolean, (string | undefined)>>

const defaultTools: ToolName[] = ["request_url", "search", /*"evaluate_luau"*/];

// this is a super fucked up way to use mutexes but idc it works & is Safe
const clientDefinedMutex = new Mutex();
const releaseClientDefinedMutex = await clientDefinedMutex.acquire();
let client: Client | undefined = undefined;

export function initPromptFetchClient(inputClient: Client) {
    client = inputClient;
    releaseClientDefinedMutex();
}

function safeJSONParse(data: any, onFailValue: any) {
    let didFail = false;
    let parsed
    try {
        parsed = JSON.parse(data)
    } catch (err: any) {
        log.warn(`error safeparsing json:`);
        log.warn(err);
        didFail = true;
    }

    if ((typeof parsed) !== (typeof onFailValue)) {
        log.warn(`error safeparsing json: typeof parsed did not match typeof onFailValue`);
        didFail = true;
    }

    if (Array.isArray(parsed) !== Array.isArray(onFailValue)) {
        log.warn(`error safeparsing json: parsed and onFailValue were not both arrays or not arrays, tldr they mismatched Array.isArray`);
        didFail = true;
    }

    return didFail ? parsed : onFailValue;
}

export interface PromptAuthor {
    id: string,
    username: string,
    avatar?: string,
}

export class Prompt<M extends AnyModel = typeof gpt41Nano, P extends boolean = false, O extends (string | undefined) = undefined> {
    name: string;
    author: PromptAuthor;
    content: string = "[empty prompt]";

    createdAt: Date = new Date();
    updatedAt: Date = new Date();

    publishedAt: P extends true ? Date : undefined = undefined!;
    published: P = false as P;
    description: string | undefined = undefined;

    origin: O = undefined as O;

    model: M = gpt41Nano as unknown as M;

    enabledTools: ToolName[] = defaultTools;
    customTools: CustomTool[] = [];

    modelParameters: Partial<InferModelParameters<M['parameters']>> = {};
    promptParameters: Partial<InferModelParameters<typeof promptParameterTypings>> = defaultPromptParameters;

    constructor(data: PromptInput) {
        this.name = data.name;
        this.author = data.author;
        this.content = data.content;

        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.publishedAt = data.publishedAt as P extends true ? Date : undefined;
        this.published = data.publishedAt as unknown as P;
        this.description = data.description;

        this.origin = data.origin as O;

        this.model = data.model as M;

        this.enabledTools = data.enabledTools;
        this.customTools = data.customTools;

        this.modelParameters = data.modelParameters;
        this.promptParameters = data.promptParameters;
    }

    async fetchAuthor(): Promise<User | undefined> {
        if (!client) {
            log.warn(`attempt to fetch prompt author while client is undefined, waiting for it to be defined`);
            (await clientDefinedMutex.acquire())(); // acquire and then immediately release it since we don't gaf about it beyond this
            client = client! as Client; // makes typescript shut up
        }

        const author = (await client.users.fetch(this.author.id).catch(err => {
            log.error(`failed to fetch user for prompt ${this.author.id}/${this.name}`);
        }));
        if (!author) return;
        return author;
    }

    static async fromDB(data: DBPrompt) {
        log.debug(`creating prompt from DB data:`);
        log.debug(data);

        let model = models[data.model as keyof typeof models] as (AnyModel | undefined); // there's always a possibility i remove a model, in those cases we must be Prepared:tm:
        if (!model) model = gpt41Nano;

        let origin = data.origin ?? undefined;

        const inputData: PromptInput = {
            name: data.name,
            author: {
                id: data.author_id,
                username: data.author_username,
                avatar: data.author_avatar ?? undefined,
            },
            content: data.content,

            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),

            publishedAt: data.published ? new Date(data.published_at ?? new Date()) : undefined,
            published: Boolean(data.published),
            description: data.description ?? undefined,

            origin: origin,

            model: model,

            enabledTools: safeJSONParse(data.enabled_tools, defaultTools),
            customTools: safeJSONParse(data.custom_tools, []),

            modelParameters: safeJSONParse(data.model_parameters, {}),
            promptParameters: safeJSONParse(data.prompt_parameters, defaultPromptParameters)
        }

        return new Prompt(inputData) as AnyPrompt;
    }

    static async new(name: string, author: User) {
        return new Prompt<typeof gpt41Nano, false, undefined>({
            name: name,
            author: {
                id: author.id,
                username: author.username,
                avatar: author.displayAvatarURL(),
            },
            content: "[empty prompt]",

            createdAt: new Date(),
            updatedAt: new Date(),

            published: false,
            publishedAt: undefined,
            description: undefined,

            origin: undefined,

            model: gpt41Nano,

            enabledTools: defaultTools,
            customTools: [],

            modelParameters: {},
            promptParameters: defaultPromptParameters,
        });
    }

    static async checkExists(author: string, name: string) {
        const data = await database("prompts").select("*").where({ author_username: author, name }).orWhere({ author_id: author, name }).first();
        if (data) return true;
        return false;
    }

    static async fromName(author: string, name: string) {
        const data = await database("prompts").select("*").where({ author_username: author, name }).orWhere({ author_id: author, name }).first();
        if (!data) return undefined;
        return this.fromDB(data);
    }

    static async clone(originAuthorId: string, originName: string, newAuthor: User, newName: string) {
        const origin = await Prompt.fromName(originAuthorId, originName) as AnyPrompt | undefined;
        if (!origin) return undefined;
        origin.author = {
            id: newAuthor.id,
            username: newAuthor.username,
            avatar: newAuthor.displayAvatarURL(),
        };
        origin.name = newName;
        (origin.origin as string | undefined) = `${originAuthorId}/${originName}`;
        origin.published = false;
        origin.publishedAt = undefined;
        return origin as unknown as Prompt<AnyModel, false, string>;
    }

    async write() {
        log.debug(`writing prompt ${this.author.id}/${this.name} with data:`);
        log.debug(this);

        const data: DBPrompt = {
            name: this.name,
            author_id: this.author.id,
            author_username: this.author.username,
            author_avatar: this.author.avatar ?? null,
            content: this.content,

            created_at: this.createdAt.getTime(),
            updated_at: new Date().getTime(), // updated Just Now as we are writing it

            published: this.published,
            published_at: this.published ? (this.publishedAt?.getTime() ?? new Date().getTime()) : null,
            description: this.description ?? null,

            origin: this.origin ?? null,

            model: this.model.name,

            enabled_tools: JSON.stringify(this.enabledTools),
            custom_tools: JSON.stringify(this.customTools),

            model_parameters: JSON.stringify(this.customTools),
            prompt_parameters: JSON.stringify(this.promptParameters),
        }

        log.debug(`converted to DB data:`);
        log.debug(data);
        log.debug(`writing to DB...`)

        return await database("prompts").insert(data).onConflict("author_id, name").merge();
    }

    getTools(): (AnyTool | CustomTool)[] {
        const regularTools: AnyTool[] = [];
        const customTools = this.customTools;
        this.enabledTools.forEach(toolName => {
            regularTools.push(tools[toolName]);
        });

        return [...regularTools, ...customTools];
    }
}

export type AnyPrompt = Prompt<AnyModel, boolean, (string | undefined)>;

export async function listPrompts(user: string, onlyPublished: boolean = false) {
    const query = database("prompts").select("name").where({ author_id: user }).orWhere({ author_username: user });
    if (onlyPublished) query.andWhere({ published: true });
    return await query;
}

export async function setEditingPrompt(user: string, promptname: string) {
    return await database("prompt_editing_metadata").insert({ user, editingPrompt: promptname }).onConflict("user").merge();
}

export async function getEditingPrompt(user: string) {
    const promptname = await database("prompt_editing_metadata").select("editingPrompt").where({ user }).first();
    if (!promptname?.editingPrompt) return undefined;
    return await Prompt.fromName(user, promptname?.editingPrompt);
}

export async function countUnnamedPrompts(user: string) {
    return Number(((await database("prompts").where({ author_id: user }).orWhere({ author_username: user }).andWhereLike("name", "unnamed").count().first()) ?? undefined)?.[0]) || 0;
}

export async function setActivePrompt(user: string, promptAuthor: string, promptName: string) {
    return await database("gpt_starting_data_overrides").insert({ user_id: user, prompt_author_id: promptAuthor, prompt_name: promptName }).onConflict("user_id").merge();
}