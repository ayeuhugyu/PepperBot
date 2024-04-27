import * as action from "../lib/discord_action.js";
import {
    Command,
    SubCommand,
    CommandData,
    SubCommandData,
} from "../lib/types/commands.js";
import { StringPagedMenuBuilder } from "../lib/types/menuBuilders.js";
import { Collection } from "discord.js";
import fs from "fs";
import util from "util";

const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
const config = configNonDefault.default;
const data = new CommandData();
data.setName("test");
data.setDescription("generic testing command");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
const command = new Command(
    data,
    async function getArguments(message) {
        return null;
    },
    async function execute(message, args) {
        const menu = new StringPagedMenuBuilder();
        menu.addPage("Hello, world!");
        menu.addPage("Goodbye, world!");
        menu.addPage("Even More Data!");
        menu.addPage("I could do this all day!");

        const builtMenu = menu.build();
        const sentMessage = await message.channel.send({
            embeds: [builtMenu.embed],
            components: [builtMenu.actionRow],
        });
        menu.begin(sentMessage, 30_000, builtMenu);
    }
);

export default command;
