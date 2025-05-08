import { DownloaderPromise } from "./types";

// downloaders
import * as applemusic from "./applemusicdl"
import * as spotify from "./spotifydl";
import * as ytdlp from "./ytdlp";
import { Video } from "../classes/queue";

export enum Downloader {
    ytdlp = "yt-dlp",
    applemusicdl = "apple-music-dl",
    spotifydl = "spotify-dl"
}

export async function getInfo(url: string, emitter: DownloaderPromise) {
    if (url.includes("music.apple.com")) {
        return applemusic.getInfo(url, emitter);
    }
    if (url.includes("spotify.com")) {
        return spotify.getInfo(url, emitter);
    }
    return ytdlp.getInfo(url, emitter);
}

export async function download(video: Video, emitter: DownloaderPromise) {
    const url = video.url;
    if (url.includes("music.apple.com")) {
        return applemusic.download(video, emitter);
    }
    if (url.includes("spotify.com")) {
        return spotify.download(video, emitter);
    }
    return ytdlp.download(video, emitter);
}