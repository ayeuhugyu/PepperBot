/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
*/
exports.up = async function(knex) {
    if (!(await knex.schema.hasTable("gpt_conversation_meta"))) await knex.schema.createTable("gpt_conversation_meta", (table) => {
        table.string("id").index().notNullable().primary();
        table.string("prompt_author_id").notNullable();
        table.string("prompt_name").notNullable();
        table.json("prompt_parameter_overrides").notNullable().defaultTo("{}");
        table.json("model_parameter_overrides").notNullable().defaultTo("{}");
        table.string("model").notNullable().defaultTo("gpt-4.1-nano");

        table.foreign(["prompt_author_id", "prompt_name"])
            .references(["author_id", "name"])
            .inTable("prompts");
    });

    if (!(await knex.schema.hasTable("gpt_starting_data_overrides"))) await knex.schema.createTable("gpt_starting_data_overrides", (table) => {
        table.string("user_id").notNullable().primary();
        table.string("prompt_author_id");
        table.string("prompt_name");
        table.json("prompt_parameter_overrides").defaultTo("{}");
        table.json("model_parameter_overrides").defaultTo("{}");
        table.string("model").defaultTo("gpt-4.1-nano");

        table.foreign(["prompt_author_id", "prompt_name"])
            .references(["author_id", "name"])
            .inTable("prompts");
    });

    if (!(await knex.schema.hasTable("gpt_force_next_new"))) await knex.schema.createTable("gpt_force_next_new", (table) => {
        table.string("user_id").notNullable().primary();
    });

    if (!(await knex.schema.hasTable("gpt_users"))) await knex.schema.createTable("gpt_users", (table) => {
        table.string("conversation_id").notNullable().references("gpt_conversation_meta.id").onDelete("CASCADE");
        table.string("id").notNullable();
        table.string("username").notNullable();
        table.string("avatar");

        table.primary(["conversation_id", "id"]);
    })

    if (!(await knex.schema.hasTable("gpt_user_messages"))) await knex.schema.createTable("gpt_user_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id").onDelete("CASCADE");
        table.enu("type", ["user"]).notNullable().index();
        table.string("id").notNullable().primary();
        table.string("author_id").notNullable().references("gpt_users.id");
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("content").notNullable();
        table.boolean("been_deleted").notNullable().defaultTo(false);
        table.string("discord_message_id").notNullable();
        table.string("discord_reference_id").nullable();
        table.string("discord_channel_id").nullable();
        table.string("discord_guild_id").nullable();
    });

    if (!(await knex.schema.hasTable("gpt_assistant_messages"))) await knex.schema.createTable("gpt_assistant_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id").onDelete("CASCADE");
        table.enu("type", ["assistant"]).notNullable().index();
        table.string("id").notNullable().primary();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("content").notNullable();
        table.json("tool_call_ids").notNullable().defaultTo("[]");
        table.boolean("been_deleted").notNullable().defaultTo(false);
        table.boolean("sent").notNullable().defaultTo(false);
        table.string("discord_message_id").nullable();
        table.string("discord_reference_id").nullable();
        table.string("discord_channel_id").nullable();
        table.string("discord_guild_id").nullable();
    });

    if (!(await knex.schema.hasTable("gpt_tool_call_messages"))) await knex.schema.createTable("gpt_tool_call_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id").onDelete("CASCADE");
        table.enu("type", ["tool_call"]).notNullable().index();
        table.string("id").notNullable().primary();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("tool_call_id").notNullable();
        table.string("tool_name").notNullable();
        table.json("arguments").notNullable();
        table.boolean("answered").notNullable().defaultTo(false);
    });

    if (!(await knex.schema.hasTable("gpt_tool_response_messages"))) await knex.schema.createTable("gpt_tool_response_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id").onDelete("CASCADE");
        table.enu("type", ["tool_response"]).notNullable().index();
        table.string("id").notNullable().primary();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("tool_call_id").notNullable();
        table.string("tool_name").notNullable();
        table.json("response").notNullable();
    });

    if (!(await knex.schema.hasTable("gpt_system_messages"))) await knex.schema.createTable("gpt_system_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id").onDelete("CASCADE");
        table.enu("type", ["system"]).notNullable().index();
        table.string("id").notNullable().primary();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("content").notNullable();
    });

    await knex.raw(`CREATE VIEW gpt_messages AS
-- user messages
SELECT
    id, conversation_id, type, created_at, content, NULL AS tool_call_ids,
    NULL AS tool_call_id, NULL AS tool_name, NULL AS arguments, NULL AS response, NULL AS answered,
    discord_message_id, discord_channel_id, discord_guild_id, author_id, been_deleted
FROM gpt_user_messages

UNION ALL

-- assistant messages
SELECT
    id, conversation_id, type, created_at, content, tool_call_ids,
    NULL AS tool_call_id, NULL AS tool_name, NULL AS arguments, NULL AS response, NULL AS answered,
    discord_message_id, discord_channel_id, discord_guild_id, NULL AS author_id, been_deleted
FROM gpt_assistant_messages

UNION ALL

-- tool call messages
SELECT
    id, conversation_id, type, created_at, NULL AS tool_call_ids,
    'tc: ' || tool_name AS content,
    tool_call_id, tool_name, arguments, NULL AS response, answered,
    NULL AS discord_message_id, NULL AS discord_channel_id, NULL AS discord_guild_id, NULL AS author_id, 0 AS been_deleted
    FROM gpt_tool_call_messages

UNION ALL

-- tool response messages
SELECT
    id, conversation_id, type, created_at, NULL AS tool_call_ids,
    'tr: ' || tool_name AS content,
    tool_call_id, tool_name, NULL AS arguments, response, NULL AS answered,
    NULL AS discord_message_id, NULL AS discord_channel_id, NULL AS discord_guild_id, NULL AS author_id, 0 AS been_deleted
FROM gpt_tool_response_messages

UNION ALL

-- system messages
SELECT
id, conversation_id, type, created_at, content, NULL AS tool_call_ids,
NULL AS tool_call_id, NULL AS tool_name, NULL AS arguments, NULL AS response, NULL AS answered,
NULL AS discord_message_id, NULL AS discord_channel_id, NULL AS discord_guild_id, NULL AS author_id, 0 AS been_deleted
FROM gpt_system_messages`);

    if (!(await knex.schema.hasTable("gpt_attachments"))) return await knex.schema.createTable("gpt_attachments", (table) => {
        table.string("message_id").notNullable().index().references("gpt_messages.id").onDelete("CASCADE");
        table.enu("type", ["image", "video", "text", "audio", "unknown", "error"]).notNullable().index();
        table.string("id").notNullable().primary();
        table.string("filename").notNullable();
        table.string("url").notNullable();
        table.integer("size").notNullable();
        table.datetime("expires_at").notNullable();
        table.text("content").nullable(); // specific to text attachments
        table.text("error").nullable(); // specific to error attachments
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTableIfExists("gpt_attachments");
    await knex.schema.dropViewIfExists("gpt_messages");
    await knex.schema.dropTableIfExists("gpt_system_messages");
    await knex.schema.dropTableIfExists("gpt_tool_response_messages");
    await knex.schema.dropTableIfExists("gpt_tool_call_messages");
    await knex.schema.dropTableIfExists("gpt_assistant_messages");
    await knex.schema.dropTableIfExists("gpt_user_messages");
    await knex.schema.dropTableIfExists("gpt_users");
    await knex.schema.dropTableIfExists("gpt_starting_data_overrides");
    return await knex.schema.dropTableIfExists("gpt_conversation_meta");
};
