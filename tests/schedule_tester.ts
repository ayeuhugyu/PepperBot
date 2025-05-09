import { fetchScheduledEventById, fetchScheduledEventsByCreatorId, ScheduledEvent, ScheduledEventType } from "../src/lib/schedule_manager";

const fetchedEvent = await fetchScheduledEventById("123");
console.log(fetchedEvent);
if (fetchedEvent) await fetchedEvent.delete();

const event = new ScheduledEvent({
    id: "123",
    creator_id: "456",
    channel_id: "789",
    content: "Test message",
    time: Date.now(),
    type: ScheduledEventType.send
})

await event.write();

const creatorsEvents = await fetchScheduledEventsByCreatorId("456");
console.log(creatorsEvents);