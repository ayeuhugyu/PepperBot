import { CategoryChannel, Client } from "discord.js";
import database from "./data_manager";
import * as log from "./log";
import * as action from "./discord_action";

export enum ScheduledEventType {
    send = 'send',
    dm = 'dm'
}

class ScheduledEvent {
    id: string;
    creator_id: string;
    channel_id: string | undefined;
    content: string;
    time: Date;
    type: string;

    constructor({
        id,
        creator_id,
        channel_id,
        content,
        time,
        type
    }: {
        id: string;
        creator_id: string;
        channel_id: string | undefined;
        content: string;
        time: string | Date | number;
        type: string | ScheduledEventType;
    }) {
        this.id = id;
        this.creator_id = creator_id;
        this.channel_id = channel_id;
        this.content = content;
        this.time = new Date(time);
        this.type = typeof type === 'string' ? type : ScheduledEventType[type];
    }

    async write() {
        log.debug(`Writing scheduled event ${this.id}`);
        await database('scheduled').insert({
            id: this.id,
            creator_id: this.creator_id,
            channel_id: this.channel_id,
            content: this.content,
            time: this.time.getTime(),
            type: this.type
        });
    }

    async delete() {
        log.debug(`Deleting scheduled event ${this.id}`);
        await database('scheduled').where({ id: this.id }).del();
    }
}

async function fetchScheduledEventsByCreatorId(creator_id: string) {
    log.debug(`Fetching scheduled events for creator ${creator_id}`);
    const events = await database('scheduled').where({ creator_id });
    return events.map((event: any) => new ScheduledEvent(event));
}

async function fetchScheduledEventById(id: string) {
    log.debug(`Fetching scheduled event with id ${id}`);
    const event = await database('scheduled').where({ id }).first();
    if (!event) {
        return undefined;
    }
    return new ScheduledEvent(event);
}

async function getAllEvents() {
    log.debug(`Fetching all scheduled events`);
    const events = await database('scheduled');
    return events.map((event: any) => new ScheduledEvent(event));
}

export { ScheduledEvent, fetchScheduledEventsByCreatorId, fetchScheduledEventById, getAllEvents };

function isMoreThan10SecondsEarlier(ts1: number, ts2: number): boolean {
    return ts1 < ts2 - 10000;
}

function execEvent(client: Client, event: ScheduledEvent) {
    log.info(`Executing scheduled event ${event.id}`);
    const executingAfterTime = isMoreThan10SecondsEarlier(event.time.getTime(), Date.now());
    const text = `<t:${Math.floor(event.time.getTime()) / 1000}:F> (<t:${Math.floor(event.time.getTime() / 1000)}:R>), event id \`${event.id}\`, notifying <@${event.creator_id}>${executingAfterTime ? " (delayed)" : ""}: \n\n${event.content}`
    if (event.type === ScheduledEventType.send && event.channel_id) {
        const channel = client.channels.cache.get(event.channel_id);
        if (channel && 'send' in channel) {
            action.send(channel, text).catch(log.error);
            return;
        }
        let fetchedChannel = client.channels.fetch(event.channel_id).catch(() => {});
        if (fetchedChannel) {
            fetchedChannel.then((channel) => {
                if (channel && 'send' in channel) {
                    action.send(channel, text).catch(log.error);
                }
            }).catch(log.error);
            return;
        }
    } else if (event.type === ScheduledEventType.dm) {
        const user = client.users.cache.get(event.creator_id);
        if (user) {
            user.createDM().then(dmChannel => {
                if (dmChannel) {
                    action.send(dmChannel, text).catch(log.error);
                }
            }).catch(log.error);
        }
    }
}

export function scheduleEvent(client: Client, event: ScheduledEvent) {
    const now = new Date();
    const timeToEvent = event.time.getTime() - now.getTime();
    if (timeToEvent > 0) {
        setTimeout(() => {
            log.info(`Executing scheduled event ${event.id} after ${timeToEvent}ms`);
            execEvent(client, event);
            event.delete();
        }, timeToEvent);
    } else {
        log.info(`Executing scheduled event ${event.id} immediately`);
        execEvent(client, event);
        event.delete();
    }
}


export function queueAllEvents(client: Client) {
    log.debug(`Queueing all scheduled events`);
    const events = getAllEvents();
    events.then((events) => {
        events.forEach((event) => {
            scheduleEvent(client, event);
        });
    }).catch(log.error);
}