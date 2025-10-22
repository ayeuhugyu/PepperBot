import { ModelName } from "./gpt/models";
import { FakeToolData } from "./gpt/tools";

export interface PromptAuthor {
    id: string;
    username: string;
    avatar_url?: string;
}

export interface PromptToolData {
    defaults: string[]; // list of names of default tools that are enabled
    custom: FakeToolData[]; // list of custom tool data
}

interface dbPrompt {
    name: string;
    content: string;

    author_id: string;
    author_username: string;
    author_avatar?: string;

    created_at: Date;
    updated_at: Date;
    published_at?: Date;

    published: number;
    default: number;

    description: string;

    api_parameters: string; // JSON string
    model: string;

    default_tools: string; // JSON string
    custom_tools: string; // JSON string
}

export class Prompt {
    name: string = "unnamed";
    content: string = "empty";
    author: PromptAuthor;

    created_at: Date = new Date();
    updated_at: Date = new Date();
    published_at?: Date;

    published: boolean = false;
    default: boolean = false;

    description: string = "no description provided";

    api_parameters: Record<string, string | number> = {};
    model: ModelName = "gpt-4.1-nano";

    tools: PromptToolData = { defaults: ["request_url", "search", "evaluate_luau"], custom: [] };

    constructor(dbObject: dbPrompt) {
        this.author = {
            id: dbObject.author_id,
            username: dbObject.author_username,
            avatar_url: dbObject.author_avatar
        };

        this.name = dbObject.name;
        this.content = dbObject.content;
        this.created_at = new Date(dbObject.created_at);
        this.updated_at = new Date(dbObject.updated_at);
        if (dbObject.published_at) {
            this.published_at = new Date(dbObject.published_at);
        }
        this.published = dbObject.published === 1;
        this.default = dbObject.default === 1;
        this.description = dbObject.description;

        try {
            this.api_parameters = JSON.parse(dbObject.api_parameters);
        } catch (e) {
            this.api_parameters = {};
        }

        this.model = dbObject.model as ModelName;

        try {
            this.tools.defaults = JSON.parse(dbObject.default_tools);
        } catch (e) {
            this.tools.defaults = [];
        }

        try {
            this.tools.custom = JSON.parse(dbObject.custom_tools);
        } catch (e) {
            this.tools.custom = [];
        }
    }
}