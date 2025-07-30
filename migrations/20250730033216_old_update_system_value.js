/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    const exists = await knex.schema.hasTable('updates');
    if (exists) {
        await knex.schema.alterTable('updates', table => {
            table.boolean('usesOldSystem').defaultTo(true);
            console.log('Column "usesOldSystem" added to "updates" table with default value true.');
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    const exists = await knex.schema.hasTable('updates');
    if (exists) {
        await knex.schema.alterTable('updates', table => {
            table.dropColumn('usesOldSystem');
            console.log('Column "usesOldSystem" removed from "updates" table.');
        });
    }
};
