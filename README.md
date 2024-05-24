# The PepperBot Project

It is our goal at PepperBot Industries:tm: to create a quality product for users to enjoy.

ok i'm sorry i just really wanted to say that

basically:\
this is a discord bot\
it was developed for my [discord server](https://discord.gg/UMaFC6tjKu)\
if i'm being honest, i don't know what my goal was\
i just wanted to make a thing\
its literally all just whatever i could come up with to occupy my time

incase you're wondering why some of the code looks so weird, 90% of it is because of me wanting to support both slash commands and message commands

if you would like more detailed update logs than the commit message, join the discord server

# Making Custom Commands

if you would like to create custom commands for pepperbot, here's a tutorial and some tips:

basic commands can be made fairly simply, here's a small template:

```js
import * as action from "../lib/discord_action.js";
import { Command, CommandData } from "../lib/types/commands.js";
import { Collection, PermissionFlagsBits } from "discord.js";
import fs from "fs";
import * as log from "../lib/log.js";
import * as globals from "../lib/globals.js";

const config = globals.config;

const data = new CommandData();
data.setName("commandname");
data.setDescription("command description");
data.setPermissions([]);
data.setPermissionsReadable("");
data.setWhitelist([]);
data.setCanRunFromBot(true);
data.setDMPermission(true);
data.setAliases([]);
const command = new Command(
    data,
    async function getArguments(message) {
        return undefined;
    },
    async function execute(message, args, fromInteraction) {},
    []
);

export default command;
```

lets go over this

### Making CommandData Objects

commandDatas basically hold all the stuff about the way the command is displayed and used by users, however has little to no effect on the actual function of the command\
it's important to understand that CommandData objects are extensions of [DiscordJS's SlashCommandBuilder](https://discord.js.org/docs/packages/builders/1.6.0/SlashCommandBuilder:Class)\
the only real important differences are: 
- they cannot use the addSubcommand and addSubcommandGroup methods
- they should not use the setDefaultPermission and setDefaultMemberPermission methods in favor of the setPermissions method
- setNSFW has no effect on text commands
- setNameLocalization(s) method has no effect on text commands

here's some specifics about command data objects:

**command names cannot include spaces and entirely lowercased**, if they don't follow both of these they will not be able to be executed.

```js
data.setName("thisisacommand"); // this is fine
data.setName("This will not work."); // this is not fine
```

aliases are in an array of strings, they have the same rules as command names do

```js
data.setAliases(["foo", "bar"]); // this is fine
data.setAliases(["foo and bar", "bar"]); // bar will work, "foo and bar" will not
data.setAliases("foo", "bar"); // this will not work
```

permissions are an arrayh of PermissionFlagsBits permissions, ex: the following would make a command exclusive to members who have the permissions ManageRoles and ManageMembers:

```js
data.setPermissions([
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageMembers,
]);
```

readable permissions are only used for display in the p/help menu, it's a lot LOT easier to just use a string like this to display them rather than trying to convert the way permissions are stored into a string that makes sense. for the previous example of setPermissions, it would be best to also do:

```js
data.setPermissionsReadable("ManageRoles, ManageMembers");
```

whitelist is an array of strings of user ids

```js
data.setWhitelist(["440163494529073152"]); // only people with the user id "440163494529073152" can use this command
data.setWhitelist(["440163494529073152", "01203910298309182"]); // only people with the user id "440163494529073152" or "01203910298309182" can use this command
data.setWhitelist([]); // everyone can use this command
data.setWhitelist(); // everyone can use this command
data.setWhitelist(["0"]); // nobody can use this command
data.setWhitelist("440163494529073152", "01203910298309182"); // this will error
```

canRunFromBot basically defines if a bot should be able to run the command, if this is false then if any user that user.bot == true tries to run it then it will not run. this is useful for preventing infinite loops

```js
data.canRunFromBot(false); // cannot run from bot users
data.canRunFromBot(true); // can run from bot users
```

setDMPermission basically defines if it should be able to be used in DM channels or not

```js
data.setDMPermission(true); // can run in DM channels
data.setDMPermission(false); // cannot run in dm channels
```

to add arguments to command data, use code similar to the following:
```js
data.addStringOption((option) =>
    option.setName("").setDescription("").setRequired(true)
);
```
to add choices (commonly used for subcommands), you can add this imside the arrow function
```js
option.addChoices(
    { name: "aname", value: "aname" },
    { name: "aname2", value: "not a name" } // while this would technically work, it's generally a good idea to have name and value be equal to eachother, otherwise it may be confusing for the users
)
```

### Making Command Objects

the arguments passed to the constructor should always follow this order: commandData, getArguments, execution, subcommands\
command data is gonna be what we just talked about,\
getArguments is a function that grabs the arguments to use,\
execution is a function that is ran when the command is executed,\
subcommands is an array of subcommands (which we will discuss later).

#### getArguments

this is NOT ran when commands are executed via slash commands, only via text commands, as slash commands use their own arguments system.

the only argument passed to the getArguments function is the message thats executing the command, nothing else.

here's some quick example getArguments functions:

```js
    async function getArguments(message) {
        const commandLength = message.content.split(" ")[0].length - 1;
        const args = new Collection();
        let argument = message.content.slice(config.generic.prefix.length + commandLength)
        if (argument) {
            argument.trim()
        } // this is necessary because if there are no arguments supplied argument will be equal to undefined and trim() will not be a function and thus will error
        args.set("argument", argument);
        return args;
    },
```

this will get you all the text coming after the command.\
 a common mistake is to slice the text by " " and then take the 2nd item in the array, but that will only be able to return one word; if someone were to run "p/command arguments go here", slicing by spaces would mean your argument would be equal to just "arguments"\
 in some cases, this is fine, but in a majority of cases it won't be.

```js
async function getArguments(message) {
    const commandLength = message.content.split(" ")[0].length - 1;
    const args = new Collection();
    args.set("argument1", message.content.split(" ")[1])
    if (args.get("argument1")) {
        args.set("argument2", message.content.slice(config.generic.prefix.length + commandLength + message.content.split(" ")[1].length + 1));
    }
    return args;
}
```

this will give you two arguments, the first argument will be the first word, the second argument will be all text after that
for example, if a user were to use "p/command firstargument then some more arguments"\
`args.get("argument1")` would be "firstargument" and `args.get("argument2")` would be "then some more arguments"

those two will probably be the most common ones you'll use, but if you need something specific feel free to mess around

#### execute

the execute function is basically the actual function of your command; its what makes the thing do its thing

theres 3 arguments passed to the execute function:
the message / interaction running it
the args returned from getArguments OR args from slash commands
and finally if/if not the execution is from a slash command

i don't think i should have to explain these, but heres a quick description:
i'll be using the arguments from the boilerplate as placeholders for whats passed to it

`message` will be a [DiscordJS Message](https://discord.js.org/docs/packages/discord.js/14.14.1/Message:Class) if from text commands, and a [DiscordJS CommandInteraction](https://discord.js.org/docs/packages/discord.js/14.14.1/CommandInteraction:Class) if from slash commands


`args` will be either whatever is returned from your getArguments function if from text commands OR a [DiscordJS CommandInteractionOptionResolver](https://discord.js.org/docs/packages/discord.js/14.14.1/CommandInteractionOptionResolver:Class)
 that i've replaced the `get()` method with a custom one that returns just the value of the option. this is just so that it works with the arguments collections i've been using

 `isInteraction` will be true if its executed from a slash command, otherwise is false.

 do with this information what you will

 side note, there's notthing limiting commands from executing eachother, just import the file and call the execute function on it. 

 ### Making Subcommands

 subcommands are similar to commands in many ways

 first, to even start creating them, you need to import SubCommand and SubCommandData from the same file that Command and CommandData are imported from

SubCommandData objects are nearly identical to CommandData objects, with the exception of DMPermission and aliases being left out.

you'll need to add a subcommand argument to the command for it to be usable
easiest way to do this is to just add
```js
data.addStringOption((option) =>
    option
        .setName("subcommand")
        .setDescription("subcommand to run")
        .setRequired(false)
        .addChoices(
            {name: "subcommandname", value: "subcommandname"},
        )
);
```
to your command data
for each subcommand you add, add a choice with the name and value as the subcommand's name.

subcommands use their own getArguments functions, and the message passed to them has the argument of the subcommand removed from it. \
for example, if someone does the command "p/command subcommand argument" then the subcommand would recieve a message reading "p/command argument"

also, in your getArguments function of your *main* command, you will need something that will set the argument "_SUBCOMMAND"
here's the most commonly used one:
```js
args.set(
    "_SUBCOMMAND",
    message.content.split(" ")[1].trim()
);
```
this should be assumable, but if _SUBCOMMAND is undefined or otherwise falsy, then the main command's execute function will not be executed.
likewise, if it is detected that one of the subcommands has _SUBCOMMAND as its name, then it will execute that. if none of them do, then it will execute the main command's execute function.

### Adding Subcommands

adding subcommands to the command is super super super simple,
when you create a command just add an array as a 4th argument and put all your subcommands in that array.
```js
const command = new Command(
    data,
    getArguments fn,
    execute fn,
    [subcommand1, subcommand2, subcommand3]
)
```

and thats pretty much everything you'll need to know about making commands
oh one final thing, if possible keep your arguments in your getArguments function the same types as your slash command arguments.

if you have any questions, join the discord server and ping @anti_pepperphobes