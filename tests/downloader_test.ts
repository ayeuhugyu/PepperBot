import { emit } from "process";
import { getInfo, download } from "../src/lib/downloaders/router";
import { DownloaderEvents, DownloaderPromise } from "../src/lib/downloaders/types";
import { resolve } from "path";
import { Video } from "../src/lib/classes/queue";

const url = "https://www.youtube.com/watch?v=tbBwELgDPD8";

let video

const emitter = new DownloaderPromise()
emitter.on(DownloaderEvents.Log, (message) => {
    console.log(message);
});
emitter.on(DownloaderEvents.Reject, (message) => {
    console.error(message);
});
emitter.on(DownloaderEvents.Resolve, (data: Video) => {
    video = data;
    console.log(data);
});

getInfo(url, emitter);
await new Promise((resolve) => emitter.once(DownloaderEvents.End, resolve));
await download(video!, emitter);