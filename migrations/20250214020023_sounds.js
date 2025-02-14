/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("sounds", (table) => {
            table.string("guild");
            table.string("user");
            table.string("name").notNullable();
            table.string("path").notNullable();
            table.timestamp("created_at").defaultTo(knex.fn.now());
        })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("sounds");
};