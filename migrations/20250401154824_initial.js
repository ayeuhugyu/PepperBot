const fs = require('fs');
const path = require('path');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    const dbFilePath = path.resolve(knex.client.config.connection.filename);

    // Ensure the database file exists
    if (!fs.existsSync(dbFilePath)) {
        fs.writeFileSync(dbFilePath, '');
        console.log(`Database file created at: ${dbFilePath}`);
    }

    return knex.schema
        .hasTable("prompts").then((exists) => {
            if (!exists) {
                console.log("Creating table: prompts");
                return knex.schema.createTable("prompts", (table) => {
                    table.string("name").notNullable();
                    table.text("content").notNullable();
                    table.string("author_id").notNullable();
                    table.string("author_username").notNullable();
                    table.string("author_avatar");
                    table.timestamp("created_at").defaultTo(knex.fn.now());
                    table.timestamp("updated_at").defaultTo(knex.fn.now());
                    table.timestamp("published_at");
                    table.string("description").notNullable().defaultTo("No description provided.");
                    table.boolean("published").notNullable().defaultTo(false);
                    table.boolean("nsfw").notNullable().defaultTo(false);
                    table.boolean("default").notNullable().defaultTo(false);
                    table.json("api_parameters").notNullable().defaultTo("{}");
                });
            }
        })
        .then(() => knex.schema.hasTable("todos").then((exists) => {
            if (!exists) {
                console.log("Creating table: todos");
                return knex.schema.createTable("todos", (table) => {
                    table.string("user").notNullable();
                    table.string("name").notNullable();
                    table.integer("item").notNullable();
                    table.string("text").notNullable();
                    table.boolean("completed").notNullable().defaultTo(false);
                });
            }
        }))
        .then(() => knex.schema.hasTable("configs").then((exists) => {
            if (!exists) {
                console.log("Creating table: configs");
                return knex.schema.createTable("configs", (table) => {
                    table.string("guild").notNullable();
                    table.string("key").notNullable();
                    table.json("value").notNullable();
                    table.string("category").notNullable();
                });
            }
        }))
        .then(() => knex.schema.hasTable("queues").then((exists) => {
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
        }))
        .then(() => knex.schema.hasTable("sounds").then((exists) => {
            if (!exists) {
                console.log("Creating table: sounds");
                return knex.schema.createTable("sounds", (table) => {
                    table.string("guild");
                    table.string("user");
                    table.string("name").notNullable();
                    table.string("path").notNullable();
                    table.timestamp("created_at").defaultTo(knex.fn.now());
                });
            }
        }))
        .then(() => knex.schema.hasTable("updates").then((exists) => {
            if (!exists) {
                console.log("Creating table: updates");
                return knex.schema.createTable("updates", (table) => {
                    table.integer('update').primary().notNullable();
                    table.string('text').notNullable();
                    table.timestamp('time').defaultTo(knex.fn.now());
                    table.string('message_id');
                    table.boolean('major').notNullable().defaultTo(false);
                });
            }
        }))
        .then(() => knex.schema.hasTable("statistics").then((exists) => {
            if (!exists) {
                console.log("Creating table: statistics");
                return knex.schema.createTable("statistics", (table) => {
                    table.string('type').notNullable();
                    table.string('name');
                    table.integer('value');
                    table.json('times');
                });
            }
        }))
        .then(() => {
            console.log("Tables created successfully");
        })
        .catch((error) => {
            console.error("Error creating tables:", error);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists("prompts")
        .dropTableIfExists("todos")
        .dropTableIfExists("configs")
        .dropTableIfExists("queues")
        .dropTableIfExists("sounds")
        .dropTableIfExists("updates")
        .dropTableIfExists("statistics")
        .then(() => {
            console.log("Tables dropped successfully");
        })
        .catch((error) => {
            console.error("Error dropping tables:", error);
        });
};
