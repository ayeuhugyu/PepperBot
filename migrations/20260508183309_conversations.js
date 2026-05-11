/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
*/
exports.up = async function(knex) {
    await knex.schema.createTableIfNotExists("gpt_conversation_meta", (table) => {
        table.string("id").index().notNullable().primary();
        table.string("prompt_author_id").notNullable().references("prompts.author_id");
        table.string("prompt_name").notNullable().references("prompts.name");
        table.json("prompt_parameter_overrides").notNullable().defaultTo("{}");
        table.json("model_parameter_overrides").notNullable().defaultTo("{}");
        table.string("model").notNullable().defaultTo("gpt-4.1-nano");
    });

    await knex.schema.createTableIfNotExists("gpt_users", (table) => {
        table.string("conversation_id").references("gpt_conversation_meta.id").notNullable();
        table.string("id").notNullable();
        table.string("username").notNullable();
        table.string("avatar");
    })

    await knex.schema.createTableIfNotExists("gpt_user_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id");
        table.enu("type", ["user"]).notNullable().index();
        table.string("id").notNullable();
        table.string("author_id").notNullable().references("gpt_users.id");
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("content").notNullable();
        table.boolean("been_deleted").notNullable().defaultTo(false);
        table.string("discord_message_id").notNullable();
        table.string("discord_reference_id").nullable();
        table.string("discord_channel_id").notNullable();
        table.string("discord_guild_id").nullable();
    });

    await knex.schema.createTableIfNotExists("gpt_assistant_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id");
        table.enu("type", ["assistant"]).notNullable().index();
        table.string("id").notNullable();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("content").notNullable();
        table.json("tool_call_ids").notNullable().defaultTo("[]");
        table.boolean("been_deleted").notNullable().defaultTo(false);
        table.boolean("sent").notNullable().defaultTo(false);
        table.string("discord_message_id").notNullable();
        table.string("discord_reference_id").notNullable();
        table.string("discord_channel_id").notNullable();
        table.string("discord_guild_id").notNullable();
    });

    await knex.schema.createTableIfNotExists("gpt_tool_call_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id");
        table.enu("type", ["tool_call"]).notNullable().index();
        table.string("id").notNullable();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("tool_call_id").notNullable();
        table.string("tool_name").notNullable();
        table.json("arguments").notNullable();
        table.boolean("answered").notNullable().defaultTo(false);
    });

    await knex.schema.createTableIfNotExists("gpt_tool_response_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id");
        table.enu("type", ["tool_response"]).notNullable().index();
        table.string("id").notNullable();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("tool_call_id").notNullable();
        table.string("tool_name").notNullable();
        table.json("response").notNullable();
    });

    await knex.schema.createTableIfNotExists("gpt_system_messages", (table) => {
        table.string("conversation_id").notNullable().index().references("gpt_conversation_meta.id");
        table.enu("type", ["system"]).notNullable().index();
        table.string("id").notNullable();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.string("content").notNullable();
    });

    await knex.raw(`CREATE VIEW gpt_messages AS
-- user messages
SELECT
    id, conversation_id, type, created_at, content,
    NULL AS tool_call_id, NULL AS tool_name, NULL AS arguments, NULL AS response,
    discord_message_id, discord_channel_id, discord_guild_id
FROM gpt_user_messages

UNION ALL

-- assistant messages
SELECT
    id, conversation_id, type, created_at, content,
    NULL AS tool_call_id, NULL AS tool_name, NULL AS arguments, NULL AS response,
    discord_message_id, discord_channel_id, discord_guild_id
FROM gpt_assistant_messages

UNION ALL

-- tool call messages
SELECT
    id, conversation_id, type, created_at,
    'Tool Call: ' || tool_name AS content,
    tool_call_id, tool_name, arguments, NULL AS response,
    NULL AS discord_message_id, NULL AS discord_channel_id, NULL AS discord_guild_id
    FROM gpt_tool_call_messages

UNION ALL

-- tool response messages
SELECT
    id, conversation_id, type, created_at,
    'Tool Response: ' || tool_name AS content,
    tool_call_id, tool_name, NULL AS arguments, response,
    NULL AS discord_message_id, NULL AS discord_channel_id, NULL AS discord_guild_id
FROM gpt_tool_response_messages

UNION ALL

-- system messages
SELECT
id, conversation_id, type, created_at, content,
NULL AS tool_call_id, NULL AS tool_name, NULL AS arguments, NULL AS response,
NULL AS discord_message_id, NULL AS discord_channel_id, NULL AS discord_guild_id
FROM gpt_system_messages`);

    return await knex.schema.createTableIfNotExists("gpt_attachments", (table) => {
        table.string("message_id").notNullable().index().references("gpt_messages.id");
        table.enu("type", ["image", "video", "text", "audio", "unknown", "error"]).notNullable().index();
        table.string("id").notNullable();
        table.string("filename").notNullable();
        table.string("url").notNullable();
        table.integer("size").notNullable();
        table.datetime("expires_at").notNullable();
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
    return await knex.schema.dropTableIfExists("gpt_conversation_meta");
};
