/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    if (!knex.schema.hasTable("prompt_editing_metadata")) return knex.schema.createTable("prompt_editing_metadata", (table) => {
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
exports.down = function(knex) {
    return knex.schema.dropTableIfExists("prompt_editing_metadata");
};
