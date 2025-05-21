import { DownloaderBase, DownloadContext } from "./base";
import { Video, Playlist } from "./media";
import { spawn } from "child_process";
import * as log from "../log"
import fs from "fs/promises";
import path from "path";

export class YtDlpDownloader extends DownloaderBase {
    getPriority(_url: string) { return 1; } // catch-all
    /**
     * Fetch info for video or playlist using yt-dlp -J.
     * Returns Video or Playlist object, or null on error.
     */
    async getInfo(url: string, ctx: DownloadContext): Promise<Video | Playlist | null> {
        ctx.log("fetching info using yt-dlp...");
        const args = [ "-J", url ];
        const cookies = process.env.PATH_TO_COOKIES ? true : false;
        if (cookies) {
            args.push("--cookies", process.env.PATH_TO_COOKIES || "");
        }
        const info = await this._runYtDlp(args, ctx);
        if (!info) return null;

        // Playlist
        if (info._type === "playlist" && Array.isArray(info.entries)) {
            const videos: Video[] = info.entries
                .filter((v: any) => v && v.url)
                .map((v: any) => new Video(
                    v.url, v.title, v.duration,
                    v.thumbnail, v.description, v.uploader,
                    undefined, "yt-dlp"
                ));
            return new Playlist(
                info.webpage_url || url,
                info.title,
                videos,
                info.thumbnail, info.description, info.uploader, "yt-dlp"
            );
        }
        // Single video
        return new Video(
            info.webpage_url || url,
            info.title,
            info.duration,
            info.thumbnail,
            info.description,
            info.uploader,
            undefined,
            "yt-dlp"
        );
    }

    /**
     * Download a single video as webm audio.
     * Returns Video object with filePath, or null on error.
     * Playlists are not downloaded.
     */
    async download(info: Video, ctx: DownloadContext): Promise<Video | null> {
        const url = info.url;
        ctx.log("fetching info for download using yt-dlp...");
        if (!info || info instanceof Playlist) {
            ctx.log("cannot download playlists, only single videos are supported.");
            return null;
        }
        const filePath = path.join("cache/ytdl", sanitize(info.title + info.url) + ".webm");
        info.filePath = filePath;

        try {
            await fs.mkdir("cache/ytdl", { recursive: true });
            try {
                await fs.access(filePath);
                ctx.log("file already exists in cache.");
                return info;
            } catch { /* Not cached, continue */ }

            ctx.log("downloading with yt-dlp...");
            const args = [ "-x", '-f', 'bestaudio/best', '--extract-audio', '--audio-format', 'mp3', '--limit-rate', '250k', "-o", filePath, url ]
            const cookies = process.env.PATH_TO_COOKIES ? true : false;
            if (cookies) {
                args.push("--cookies", process.env.PATH_TO_COOKIES || "");
            }
            await this._runYtDlp(args, ctx, true);
            ctx.log("download complete!");
            return info;
        } catch (err: any) {
            ctx.log(`download failed: ${err?.message || err}`);
            return null;
        }
    }

    // infoOnly disables logging stdout for download, only logs errors
    private async _runYtDlp(args: string[], ctx: DownloadContext, infoOnly = false): Promise<any> {
        return new Promise(resolve => {
            const proc = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
            let output = "";
            let errorOutput = "";

            proc.stdout.on("data", (chunk) => {
                const msg = chunk.toString();
                log.debug(msg);
                output += msg;
            });
            proc.stderr.on("data", (chunk) => {
                const msg = chunk.toString();
                if (msg.trim().length > 0) ctx.log(msg);
                errorOutput += msg;
            });
            proc.on("close", (code) => {
                if (code !== 0 && !infoOnly) {
                    ctx.log(`yt-dlp exited with code ${code}`);
                    resolve(null);
                } else {
                    try {
                        resolve(output ? JSON.parse(output) : undefined);
                    } catch (err: any) {
                        ctx.log(`yt-dlp output parse failure: ${err?.message || err}`);
                        resolve(null);
                    }
                }
            });
        });
    }
}

function sanitize(str: string) {
    return str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}