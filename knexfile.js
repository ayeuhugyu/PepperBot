// Update with your config settings.

/**
 * @type import('knex').Knex.Config
 */
module.exports = {
    client: 'sqlite3',
    connection: {
        filename: './resources/database.db',
    },
    useNullAsDefault: true,
    migrations: {
        directory: './migrations',
    }
};