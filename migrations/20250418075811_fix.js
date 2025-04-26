/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    console.log('Checking if column "api_parameters" exists in "prompts" table...');
    const exists = await knex.schema.hasColumn('prompts', 'api_parameters');
    if (!exists) {
        console.log('Column "api_parameters" does not exist. Adding column...');
        await knex.schema.table('prompts', function(table) {
            table.json('api_parameters');
        });
        console.log('Column "api_parameters" added successfully.');
    } else {
        console.log('Column "api_parameters" already exists. No changes made.');
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    console.log('Checking if column "api_parameters" exists in "prompts" table...');
    const exists = await knex.schema.hasColumn('prompts', 'api_parameters');
    if (exists) {
        console.log('Column "api_parameters" exists. Dropping column...');
        await knex.schema.table('prompts', function(table) {
            table.dropColumn('api_parameters');
        });
        console.log('Column "api_parameters" dropped successfully.');
    } else {
        console.log('Column "api_parameters" does not exist. No changes made.');
    }
};
