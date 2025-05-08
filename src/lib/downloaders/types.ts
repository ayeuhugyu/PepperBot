import { EventEmitter } from "stream";
import { Playlist, Video } from "../classes/queue";

export enum DownloaderEvents {
    Log = "log",
    Reject = "reject",
    Resolve = "resolve",
    End = "end",
}

export class DownloaderPromise extends EventEmitter {
    constructor() {
        super();
        this.log = this.log.bind(this);
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
    }
    log(message: string) {
        this.emit(DownloaderEvents.Log, message);
    }
    resolve(data: Video | Playlist) {
        this.emit(DownloaderEvents.Resolve, data);
        this.emit(DownloaderEvents.End);
    }
    reject(message: string) {
        this.emit(DownloaderEvents.Reject, message)
        this.emit(DownloaderEvents.End);
    }
}