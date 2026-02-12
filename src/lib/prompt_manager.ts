import database from "./data_manager";
import { ModelName } from "./gpt/models";
import { FakeToolData } from "./gpt/tools";
import { OmitMethods } from "./omitMethods";

export interface PromptAuthor {
    id: string;
    username: string;
    avatar_url?: string;
}

export interface PromptToolData {
    defaults: string[]; // list of names of default tools that are enabled
    custom: FakeToolData[]; // list of custom tool data
}

// interface dbPrompt {
//     name: string;
//     content: string;

//     author_id: string;
//     author_username: string;
//     author_avatar?: string;

//     created_at: Date;
//     updated_at: Date;
//     published_at?: Date;

//     published: number;
//     default: number;

//     description: string;

//     api_parameters: string; // JSON string
//     model: string;

//     default_tools: string; // JSON string
//     custom_tools: string; // JSON string
// }

// export class Prompt {
//     name: string = "unnamed";
//     content: string = "empty";
//     author: PromptAuthor;

//     created_at: Date = new Date();
//     updated_at: Date = new Date();
//     published_at?: Date;

//     published: boolean = false;
//     default: boolean = false;

//     description: string = "no description provided";

//     api_parameters: Record<string, string | number> = {};
//     model: ModelName = "gpt-4.1-nano";

//     tools: PromptToolData = { defaults: ["request_url", "search", "evaluate_luau"], custom: [] };

//     constructor(dbObject: dbPrompt) {
//         this.author = {
//             id: dbObject.author_id,
//             username: dbObject.author_username,
//             avatar_url: dbObject.author_avatar
//         };

//         this.name = dbObject.name;
//         this.content = dbObject.content;
//         this.created_at = new Date(dbObject.created_at);
//         this.updated_at = new Date(dbObject.updated_at);
//         if (dbObject.published_at) {
//             this.published_at = new Date(dbObject.published_at);
//         }
//         this.published = dbObject.published === 1;
//         this.default = dbObject.default === 1;
//         this.description = dbObject.description;

//         try {
//             this.api_parameters = JSON.parse(dbObject.api_parameters);
//         } catch (e) {
//             this.api_parameters = {};
//         }

//         this.model = dbObject.model as ModelName;

//         try {
//             this.tools.defaults = JSON.parse(dbObject.default_tools);
//         } catch (e) {
//             this.tools.defaults = [];
//         }

//         try {
//             this.tools.custom = JSON.parse(dbObject.custom_tools);
//         } catch (e) {
//             this.tools.custom = [];
//         }
//     }
// }


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

    enabledTools: string[] = ["request_url", "search", "evaluate_luau"];
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