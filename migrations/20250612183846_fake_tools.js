/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    const hasTable = await knex.schema.hasTable('prompts');

    if (hasTable) {
        const hasColumn = await knex.schema.hasColumn('prompts', 'tools');

        if (!hasColumn) {
            await knex.schema.alterTable('prompts', function(table) {
                table.jsonb('tools').notNullable().defaultTo('["request_url", "search"]');
            });
            console.log('Added tools column to prompts table');
        }
    } else {
        console.log('prompts table does not exist, skipping');
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    const hasTable = await knex.schema.hasTable('prompts');

    if (hasTable) {
        const hasColumn = await knex.schema.hasColumn('prompts', 'tools');

        if (hasColumn) {
            await knex.schema.alterTable('prompts', function(table) {
                table.dropColumn('tools');
            });
            console.log('Dropped tools column from prompts table');
        }
    } else {
    }
};
