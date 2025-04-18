/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    console.log('Adding api_parameters column to prompts table');
    return knex.schema.table('prompts', function(table) {
        table.json('api_parameters');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    console.log('Removing api_parameters column from prompts table');
    return knex.schema.table('prompts', function(table) {
        table.dropColumn('api_parameters');
    });
};
