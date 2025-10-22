// old prompts:

// export interface dbPrompt {
//     name: string;
//     content: string;
//     author_id: string;
//     author_username: string;
//     author_avatar: string | undefined;

//     created_at: Date;
//     updated_at: Date;
//     published_at: Date | undefined;

//     published: boolean;
//     description: string;
//     nsfw: boolean;
//     default: boolean;

//     api_parameters: string; // JSON string of Record<string, number | string>, model name is inside here under "model"
//     tools: string; // JSON string, an array of tool names or JSON objects
// }




/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

};
