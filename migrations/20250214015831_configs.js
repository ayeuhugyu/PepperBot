/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("configs", (table) => {
            table.string("guild").notNullable();
            table.string("key").notNullable();
            table.json("value").notNullable();
            table.string("category").notNullable();
        })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("configs");
};