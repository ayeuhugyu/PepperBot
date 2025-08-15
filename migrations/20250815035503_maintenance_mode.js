/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.hasTable("maintenance_mode").then((exists) => {
        if (!exists) {
            console.log("Creating table: maintenance_mode");
            return knex.schema.createTable("maintenance_mode", (table) => {
                table.increments("id").primary();
                table.boolean("enabled").notNullable().defaultTo(false);
                table.string("end_timestamp").nullable(); // unix timestamp as string
                table.timestamp("created_at").defaultTo(knex.fn.now());
                table.timestamp("updated_at").defaultTo(knex.fn.now());
            });
        }
    }).then(() => {
        // Insert initial row
        return knex("maintenance_mode").insert({
            enabled: false,
            end_timestamp: null
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists("maintenance_mode");
};
