import { Video } from "../classes/queue";
import { DownloaderPromise } from "./types";

export function getInfo(url: string, { log, resolve, reject }: DownloaderPromise) {
    reject("Apple Music downloader is not implemented. Info cannot be fetched.");
}

export function download(video: Video, { log, resolve, reject }: DownloaderPromise) {
    reject("Apple Music downloader is not implemented. Video cannot be downloaded.");
}