import { Client, ClientUser, User } from "discord.js"
import { AnyModel, InferModelParameters, Model, ModelParameter } from "./modelTypes";
import { ToolName, tools } from "./tools";
import { CustomTool } from "./toolTypes";
import z from "zod";
import { OmitMethods } from "../omitMethods";
import gpt41Nano from "./models/gpt-4.1-nano";
import { models } from "./models";
import * as log from "../log";
import { Mutex } from "async-mutex";

const promptParameters: Record<string, ModelParameter> = { // no need to remake this type just because this isn't a model, it'd be the exact same
    "processingMessage": {
        key: "processingMessage",
        description: "toggles whether or not the \"processing...\" message will appear. when true (default), it will appear. when false, it won't.",
        schema: z.boolean().default(true),
    },
    "IOReplacements": {
        key: "IOReplacements",
        description: "whether or not to enable the input / output replacements. when true (default), user, channel, and role mentions will be replaced with their actual names instead of their id's. when false, they will be left untouched. note that the bot will still have mass pings (@everyone, @here, and all role mentions) replaced, assuming the server was not configured otherwise.",
        schema: z.boolean().default(true),
    }
}

interface DBPrompt {
    name: string;
    author_id: string;
    author_username: string;
    author_avatar: string;
    content: string;

    createdAt: number;
    updatedAt: number;

    publishedAt: number | null;
    published: boolean;
    description: string;

    origin: string | null;

    model: string;

    enabledTools: string;
    customTools: string;

    modelParameters: string;
    promptParameters: string;
}

type PromptInput = OmitMethods<Prompt<AnyModel, boolean, (string | undefined)>>

const defaultTools: ToolName[] = ["request_url", "search", "evaluate_luau"];

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
    let parsed = JSON.parse(data).catch((err: any) => {
        log.warn(`error safeparsing json:`);
        log.warn(err);
        didFail = true;
    });

    return didFail ? parsed : onFailValue;
}

export class Prompt<M extends AnyModel = typeof gpt41Nano, P extends boolean = false, O extends (string | undefined) = undefined> {
    name: string;
    author: User;
    content: string = "[empty prompt]";
    
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    
    publishedAt: P extends true ? Date : undefined = undefined!;
    published: P = false as P;
    description: string = "[no description provided]";

    origin: O = undefined as O;

    model: M = gpt41Nano as unknown as M;

    enabledTools: ToolName[] = defaultTools;
    customTools: CustomTool[] = [];
    
    modelParameters: Partial<InferModelParameters<M['parameters']>> = {};
    promptParameters: Partial<InferModelParameters<typeof promptParameters>> = {};

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

    static async fromDB(data: DBPrompt) {
        if (!client) {
            log.warn(`attempt to create prompt from DB while client is undefined, waiting for it to be defined`);
            (await clientDefinedMutex.acquire())(); // acquire and then immediately release it since we don't gaf about it beyond this
            client = client! as Client; // makes typescript shut up
        }
        const author = (await client.users.fetch(data.author_id).catch(err => {
            log.error(`failed to fetch user for prompt ${data.author_id}/${data.name}`);
        }));
        if (!author) return;

        log.debug(`creating prompt from DB data:`);
        log.debug(data);
        let model = models[data.model as keyof typeof models] as (AnyModel | undefined); // there's always a possibility i remove a model, in those cases we must be Prepared:tm:
        if (!model) model = gpt41Nano;
        let origin = data.origin ?? undefined;
        
        let enabledTools = defaultTools;
        let jsonParsedEnabledTools = safeJSONParse(data.enabledTools, defaultTools)
        if (Array.isArray(jsonParsedEnabledTools)) {
            enabledTools = jsonParsedEnabledTools.filter(v => Object.keys(tools).includes(v));
        } else { // shouldn't ever happen, but just in case
            log.warn(`JSON parsed tools for ${data.author_id}/${data.name} was not an array`);
        }

        const inputData: PromptInput = {
            name: data.name,
            author: author,
            content: data.content,

            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),

            publishedAt: data.published ? new Date(data.publishedAt ?? new Date()) : undefined,
            published: data.published,
            description: data.description,
            
            origin: origin,

            model: model,

            enabledTools: enabledTools as ToolName[],
            customTools: safeJSONParse(data.customTools, []), 

            modelParameters: safeJSONParse(data.modelParameters, {}),
            promptParameters: safeJSONParse(data.promptParameters, {})
        }

        return new Prompt(inputData);
    }

    static async new(name: string, author: User) {
        return new Prompt({ 
            name: name, 
            author: author, 
            content: "[empty prompt]",

            createdAt: new Date(),
            updatedAt: new Date(),

            published: false,
            publishedAt: undefined,
            description: "[no description provided]",

            origin: undefined,

            model: gpt41Nano,

            enabledTools: defaultTools,
            customTools: [],

            modelParameters: {},
            promptParameters: {},
        });
    }
}

