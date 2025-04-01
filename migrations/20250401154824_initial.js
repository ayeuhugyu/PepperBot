/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTableIfNotExists("prompts", (table) => {
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
        })
        .createTableIfNotExists("todos", (table) => {
            table.string("user").notNullable();
            table.string("name").notNullable();
            table.integer("item").notNullable();
            table.string("text").notNullable();
            table.boolean("completed").notNullable().defaultTo(false);
        })
        .createTableIfNotExists("configs", (table) => {
            table.string("guild").notNullable();
            table.string("key").notNullable();
            table.json("value").notNullable();
            table.string("category").notNullable();
        })
        .createTableIfNotExists("queues", (table) => {
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
        })
        .createTableIfNotExists("sounds", (table) => {
            table.string("guild");
            table.string("user");
            table.string("name").notNullable();
            table.string("path").notNullable();
            table.timestamp("created_at").defaultTo(knex.fn.now());
        })
        .createTableIfNotExists("updates", (table) => {
            table.integer('update').primary().notNullable();
            table.string('text').notNullable();
            table.timestamp('time').defaultTo(knex.fn.now());
            table.string('message_id');
            table.boolean('major').notNullable().defaultTo(false);
        })
        .createTableIfNotExists('statistics', (table) => {
            table.string('type').notNullable();
            table.string('name');
            table.integer('value');
            table.json('times');
        })
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
