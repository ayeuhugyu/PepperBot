/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    if (!knex.schema.hasTable("prompt_editing_metadata")) return await knex.schema.createTable("prompt_editing_metadata", (table) => {
        table.string("user").primary().notNullable();
        table.string("editingPrompt").notNullable();

        table.foreign(["user", "editingPrompt"])
            .references(["author_id", "name"])
            .inTable("prompts")
            .onDelete("CASCADE");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return await knex.schema.dropTableIfExists("prompt_editing_metadata");
};
