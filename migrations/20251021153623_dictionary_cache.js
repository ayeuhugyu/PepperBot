/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.hasTable("thesaurus_cache").then((exists) => {
        if (!exists) {
            console.log("Creating table: thesaurus_cache");
            return knex.schema.createTable("thesaurus_cache", (table) => {
                table.increments("id").primary();
                table.string("word").notNullable().unique();
                table.text("data").notNullable();
                table.timestamp("created_at").defaultTo(knex.fn.now());
            });
        }
    })
    .then(() => {
        console.log("Dictionary cache table created successfully");
    })
    .catch((error) => {
        console.error("Error creating dictionary_cache table:", error);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists("thesaurus_cache")
    .then(() => {
        console.log("Thesaurus cache table dropped successfully");
    })
    .catch((error) => {
        console.error("Error dropping thesaurus_cache table:", error);
    });
};
