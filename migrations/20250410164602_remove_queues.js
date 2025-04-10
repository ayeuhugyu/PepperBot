/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.hasTable("queues").then((exists) => {
        if (exists) {
            console.log("Dropping table: queues");
            return knex.schema.dropTable("queues");
        }
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.hasTable("queues").then((exists) => {
        if (!exists) {
            console.log("Creating table: queues");
            return knex.schema.createTable("queues", (table) => {
                table.string("guild").notNullable();
                table.string("type").notNullable();
                table.integer("index");
                table.string("url");
                table.string("title");
                table.integer("length");
                table.string("videoId");
                table.string("name");
                table.string("key");
                table.string("value");
            });
        }
    });
};
