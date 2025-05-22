import { DownloaderBase, DownloadContext } from "./base";
import { Video, Playlist } from "../music/media";
import { spawn } from "child_process";
import * as log from "../log"
import fs from "fs/promises";
import path from "path";

// for more in detail examples, see the yt-dlp downloader

export class ExampleDownloader extends DownloaderBase {
    getPriority(url: string) {
        if (url.match(/https?:\/\/example.com/)) {
            return 10;
        }
        return 0;
    }
    async getInfo(_url: string, ctx: DownloadContext): Promise<Video | Playlist | null> {
        ctx.log("fetching info using example downloader...");
        return new Video(
            "https://example.com/", // media url
            "Example Media", // media title
            0, // put zero if you don't know
            "https://example.com/thumbnail.jpg", // not required
            "Example media description", // not required
            "Example Uploader", // not required
            undefined, // file path, should be undefined for now. it'll be set later by the download function.
            "example" // downloader name
        );
        // see playlist class for how those are created
    }
    async download(info: Video, ctx: DownloadContext): Promise<Video | null> {
        ctx.log("fetching info for download using example downloader...");
        return Object.assign(info, {
            filePath: "cache/exampledownloader/" + sanitize(info.title) + ".mp3",
        })
    }
}

function sanitize(str: string) {
    return str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}