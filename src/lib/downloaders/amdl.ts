import { DownloaderBase, DownloadContext } from "./base";
import { Video, Playlist } from "../music/media";
import { spawn } from "child_process";
import * as log from "../log"
import fs from "fs/promises";
import path from "path";
import { Writable } from "stream";

const urlRegex = /https?:\/\/music.apple.com\/.+\?i=(\d+)/; // TODO: update this regex to match playlists and albums

enum AppleMusicMediaType {
    Track = "track",
    Album = "album",
    Playlist = "playlist",
}

const baseUrl = "https://amdl.reidlab.pink/api/"

export class AppleMusicDownloader extends DownloaderBase {
    getPriority(url: string) {
        if (url.match(urlRegex)) {
            return 10;
        }
        return 0;
    }
    async getInfo(url: string, ctx: DownloadContext): Promise<Video | Playlist | null> {
        const id = url.match(urlRegex)?.[1];
        const mediaType = AppleMusicMediaType.Track; // temporary, need to make this logic
        if (!id) {
            ctx.log("url does not match example downloader regex");
            return null;
        }
        if (mediaType === AppleMusicMediaType.Track) {
            ctx.log("fetching track metadata using apple music downloader (AMDL)...");
            const response = await fetch(baseUrl + "getTrackMetadata?id=" + id);
            if (!response.ok) {
                ctx.log("failed to fetch track metadata; status: " + response.status);
                return null;
            }
            const json = await response.json();
            if (!json) {
                ctx.log("failed to parse track metadata");
                return null;
            }
            let video: Video;
            try {
                const data = json.data[0];
                video = new Video(
                    data.attributes.url,
                    data.attributes.name,
                    Math.floor(data.attributes.durationInMillis / 1000),
                    data.attributes.artwork.url.replace("{w}x{h}", "512x512"),
                    `\n     album: ${data.attributes.albumName} \n     release Date: ${data.attributes.releaseDate}`,
                    data.attributes.artistName,
                    undefined,
                    "amdl",
                )
            } catch (e) { // TODO: add real error handling so that everything doenst fall to shit whenever anything happens
                ctx.log("failed to parse track metadata: " + e);
                return null;
            }

            if (!video) {
                ctx.log("failed to parse track metadata");
                return null;
            }
            return video;
        }
        ctx.log("failed to fetch track metadata; media type not found");
        return null;
    }
    async download(info: Video, ctx: DownloadContext): Promise<Video | null> {
        const outputDir = "cache/amdl";
        const id = info.url.match(urlRegex)?.[1];
        if (!id) {
            ctx.log("url does not match example downloader regex");
            return null;
        }
        const fileName = sanitize(info.title) + id + ".m4a";
        const filePath = path.join(outputDir, fileName);

        // Check if file already exists
        try {
            await fs.access(filePath);
            ctx.log(`file already exists at ${filePath}, skipping download`);
            info.filePath = filePath;
            return info;
        } catch {
            // File does not exist, continue to download
        }

        ctx.log("downloading track using apple music downloader (AMDL)...");
        const response = await fetch(baseUrl + "download?codec=aac_he_legacy&id=" + id);
        if (!response.ok || !response.body) {
            ctx.log("failed to fetch track download url; status: " + response.status);
            return null;
        }

        const reader = response.body.getReader();
        const { value: firstChunk, done } = await reader.read();

        await fs.mkdir(outputDir, { recursive: true });

        // Use Node.js streams to pipe the response body to the file
        const { createWriteStream } = await import("fs");
        const fileStream = createWriteStream(filePath);

        // Convert the web ReadableStream to a Node.js stream and pipe to file
        const stream = require('stream');
        const { finished } = require('stream/promises');
        return new Promise<Video | null>(async (resolve) => {
            try {
                // Reconstruct the stream with the first chunk
                const nodeStream = stream.Readable.from((async function* () {
                    if (firstChunk) yield firstChunk;
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        yield value;
                    }
                })());
                nodeStream.pipe(fileStream);
                await finished(fileStream);
                info.filePath = filePath;
                resolve(info);
            } catch (err: any) {
                ctx.log("error writing file: " + err);
                try { await fs.unlink(filePath); } catch {}
                resolve(null);
            }
        });
    }
}

function sanitize(str: string) {
    return str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}