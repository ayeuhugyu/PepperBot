import database from "../data_manager";
import { ModelName } from "./models";
import { FakeToolData, ToolName } from "./tools";
import { OmitMethods } from "../omitMethods";

export interface PromptAuthor {
    id: string;
    username: string;
    avatar_url?: string;
}

export interface PromptToolData {
    defaults: string[]; // list of names of default tools that are enabled
    custom: FakeToolData[]; // list of custom tool data
}

type PureDataPrompt = Omit<OmitMethods<Prompt>, "promptParameters"> & { promptParameters: OmitMethods<PromptParameters> }
type DBPRompt = Omit<PureDataPrompt, "enabledTools" | "customTools" | "apiParameters" | "promptParameters"> & { enabledTools: string, customTools: string, apiParameters: string, promptParameters: string };
export class PromptParameters {
    enableProcessingMessage: boolean = true;
    enableInputOutputReplacements: boolean = true;
    enableContentTemplatingSyntax: boolean = true;

    constructor(data: Partial<PromptParameters>) {
        Object.assign(this, data);
    }
}

export class Prompt {
    name: string;
    content: string = "empty";
    author: PromptAuthor;
    createdAt: number = Date.now();
    updatedAt: number = Date.now();
    publishedAt: number | undefined = undefined;

    published: boolean = false;
    default: boolean = false;

    description: string = "no description provided";

    apiParameters: Record<string, string | number> = {};
    model: ModelName = "gpt-4.1-nano";

    enabledTools: ToolName[] = ["request_url", "search", "evaluate_luau"];
    customTools: FakeToolData[] = [];

    promptParameters: PromptParameters = new PromptParameters({});

    constructor(data: Partial<PureDataPrompt> & Pick<PureDataPrompt, "author" | "content" | "name">) {
        this.name = data.name;
        this.content = data.content;
        this.author = data.author;
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
        this.publishedAt = data.publishedAt || Date.now();
        this.published = data.published ?? false;
        if (data.apiParameters) this.apiParameters = data.apiParameters
        if (data.model) this.model = data.model
        if (data.enabledTools) this.enabledTools = data.enabledTools
        if (data.customTools) this.customTools = data.customTools
        if (data.promptParameters) this.promptParameters = new PromptParameters(data.promptParameters)
    }

    static fromDB(data: DBPRompt) {
        return new Prompt({
            ...data,
            apiParameters: JSON.parse(data.apiParameters) as Prompt['apiParameters'],
            enabledTools: JSON.parse(data.enabledTools) as Prompt['enabledTools'],
            customTools: JSON.parse(data.customTools) as Prompt['customTools'],
            promptParameters: JSON.parse(data.promptParameters) as Prompt['promptParameters'],
        })
    }

    async write() {
        database("prompts").insert({
            name: this.name,
            content: this.content,
            author: JSON.stringify(this.author),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            publishedAt: this.publishedAt,
            published: this.published,
            default: this.default,
            description: this.description,
            apiParameters: JSON.stringify(this.apiParameters),
            model: this.model,
            enabledTools: JSON.stringify(this.enabledTools),
            customTools: JSON.stringify(this.customTools),
            promptParameters: JSON.stringify(this.promptParameters)
        }).onConflict(database.raw("name, json_extract(author, '$.id')")).merge();
    }
}