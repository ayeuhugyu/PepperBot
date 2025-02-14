/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("queues", (table) => {
            table.string("guild");
            table.string("user");
            table.string("queue_name").notNullable();
            table.integer("index").notNullable();
            table.string("link").notNullable();
            table.string("title").notNullable();
            table.string("currentIndex")
            table.timestamp("created_at").defaultTo(knex.fn.now());
        })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("queues");
};