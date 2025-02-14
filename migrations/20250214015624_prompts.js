/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("prompts", (table) => {
            table.string("user").notNullable();
            table.string("name").notNullable();
            table.string("text").notNullable();
            table.timestamp("created_at").defaultTo(knex.fn.now());
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("prompts");
};