import EventEmitter from "events";
import type { Level } from "./log"

const GlobalEvents = new EventEmitter<{
    log: [message: string, level: Level];
}>;

export default GlobalEvents;