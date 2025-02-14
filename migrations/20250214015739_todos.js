/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("todos", (table) => {
            table.string("user").notNullable();
            table.string("name").notNullable();
            table.integer("item").notNullable();
            table.string("text").notNullable();
            table.boolean("completed").notNullable().defaultTo(false);
            table.timestamp("created_at").defaultTo(knex.fn.now());
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("todos");
};