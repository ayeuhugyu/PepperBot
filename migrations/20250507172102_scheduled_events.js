/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    const exists = await knex.schema.hasTable('scheduled');
    if (!exists) {
        console.log('Creating missing scheduled table');
        await knex.schema.createTable('scheduled', (table) => {
            table.string('id').primary();
            table.string('creator_id').notNullable();
            table.string('channel_id');
            table.text('content').notNullable();
            table.dateTime('time').notNullable().defaultTo(knex.fn.now());
            table.string('type').notNullable();
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('scheduled');
};
