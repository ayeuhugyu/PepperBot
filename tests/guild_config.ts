import { fetchGuildConfig } from "../src/lib/guild_config_manager";
import * as log from "../src/lib/log";

const config = await fetchGuildConfig("1234567890")

config.other.prefix = "d/"

await config.write()

log.debug(await fetchGuildConfig("1234567890"))