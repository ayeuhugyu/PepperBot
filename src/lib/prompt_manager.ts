export interface PromptAuthor {
    id: string;
    username: string;
    avatar: string | undefined;
}

export class Prompt {
    name: string = "Undefined";
    content: string = "Prompt undefined.";

    created_at: Date = new Date();
    updated_at: Date = new Date();
    published_at: Date | undefined = undefined;

    author: PromptAuthor = { id: "0", username: "Unknown", avatar: undefined }; // just makes it so i dont need to store the Entire User (a massive object) to only end up using a few values
    published: boolean = false;
    description: string = "No description provided.";
    nsfw: boolean = false;
}