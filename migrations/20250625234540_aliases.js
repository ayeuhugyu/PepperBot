/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('aliases', function(table) {
        table.increments('id').primary();
        table.string('userId').notNullable();
        table.string('alias').notNullable();
        table.string('value').notNullable();
        table.index(['userId', 'alias'], 'unique_user_alias', { unique: true });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('aliases');
};
