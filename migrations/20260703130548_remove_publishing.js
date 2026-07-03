/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable("prompts", (table) => {
        table.dropColumns("description", "published", "published_at", "origin");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable("prompts", (table) => {
        table.bigInteger('published_at').nullable().defaultTo(null);
        table.boolean('published').notNullable().index().defaultTo(false);
        table.string('description').nullable().defaultTo(null);
        table.string('origin').nullable().defaultTo(null);
    })
};
