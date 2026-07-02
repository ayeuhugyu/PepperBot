/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return new Promise(async (resolve) => {
        await knex.schema.renameTable('prompts', 'old_prompts');
        await knex.schema.createTable('prompts', (table) => {
            table.string('name').notNullable().index();
            table.string('author_id').notNullable().index();
            table.string('author_username').notNullable();
            table.string('author_avatar').nullable();
            table.text('content').notNullable();

            table.bigInteger('created_at').notNullable();
            table.bigInteger('updated_at').notNullable().index();

            table.bigInteger('published_at').nullable();
            table.boolean('published').notNullable().index();
            table.string('description').nullable();

            table.string('origin').nullable();

            table.string('model').notNullable();

            table.text('enabled_tools').notNullable();
            table.text('custom_tools').notNullable();

            table.text('model_parameters').notNullable();
            table.text('prompt_parameters').notNullable();

            table.primary(['author_id', 'name']);
        });

        await knex.schema.createTable('prompt_defaults', (table) => {
            table.text("user_id").notNullable().index();
            table.text("author_id").notNullable();
            table.text("prompt_name").notNullable();
        });

        const records = await knex('old_prompts').select('*');
        for (const record of records) {
            const parsedAPIParameters = JSON.parse(record.api_parameters) ?? {};
            if (record.default) {
                await knex("prompt_defaults").insert({
                    user_id: record.author_id,
                    author_id: record.author_id,
                    prompt_name: record.name,
                });
            }
            await knex("prompts").insert({
                name: record.name,
                author_id: record.author_id,
                author_username: record.author_username,
                author_avatar: record.author_avatar,
                content: record.content,

                created_at: record.created_at,
                updated_at: record.updated_at ?? record.updated_at,

                published: record.published,
                published_at: record.published ? record.published_at ?? record.created_at : null,
                description: record.description,

                origin: null, // origin doesn't exist in the previous table

                model: parsedAPIParameters["model"] ?? "gpt-4.1-nano",

                enabled_tools: JSON.stringify(JSON.parse(record.tools) ?? ["request_url", "search"]),
                custom_tools: JSON.stringify([]), // custom tools couldn't be created before this point, while theoretically the data structures for them existed none will have been created

                model_parameters: JSON.stringify(parsedAPIParameters), // these will be autofiltered the next time it is applicable, no need to worry about the "model" key being in them
                prompt_parameters: JSON.stringify({}) // didn't exist in the previous table
            });
        }

        await knex.schema.dropTable("old_prompts");
        resolve();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return new Promise(async (resolve) => {

        await knex.schema.renameTable('prompts', 'old_prompts');
        await knex.schema.createTable("prompts", (table) => {
            table.string("name").notNullable();
            table.text("content").notNullable();
            table.string("author_id").notNullable();
            table.string("author_username").notNullable();
            table.string("author_avatar");
            table.timestamp("created_at").defaultTo(knex.fn.now());
            table.timestamp("updated_at").defaultTo(knex.fn.now());
            table.timestamp("published_at");
            table.string("description").notNullable().defaultTo("No description provided.");
            table.boolean("published").notNullable().defaultTo(false);
            table.boolean("nsfw").notNullable().defaultTo(false);
            table.boolean("default").notNullable().defaultTo(false);
            table.json("api_parameters").notNullable().defaultTo("{}");
            table.jsonb('tools').notNullable().defaultTo('["request_url", "search"]')
        });

        const promptDefaults = {};

        const promptDefaultsRecords = await knex("prompt_defaults").select("*");
        for (const defaultRecord of promptDefaultsRecords) {
            // defaults where the user_id !== author_id cannot be converted due to incompatabilities with the old system
            if (defaultRecord.user_id == defaultRecord.author_id) promptDefaults[defaultRecord.user_id] = defaultRecord.prompt_name;
        }

        const records = await knex('old_prompts').select('*');
        for (const record of records) {
            const parsedAPIParameters = JSON.parse(record.api_parameters) ?? {};
            parsedAPIParameters["model"] = record.model;
            knex("prompts").insert({
                name: record.name,
                content: record.content,
                author_id: record.author_id,
                author_username: record.author_username,
                author_avatar: record.author_avatar,
                created_at: record.created_at,
                updated_at: record.updated_at,
                published: record.published,
                published_at: record.published ? record.published_at ?? record.created_at : null,
                description: record.description,
                nsfw: false,
                default: (promptDefaults[record.author_id] == record.name),
                api_parameters: JSON.stringify(parsedAPIParameters),
                tools: JSON.stringify(record.enabled_tools),
            })
        }

        await knex.schema.dropTable("old_prompts");
        await knex.schema.dropTable("prompt_defaults");
    });
};
