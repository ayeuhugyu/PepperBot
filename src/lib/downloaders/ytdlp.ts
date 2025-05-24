import { DownloaderBase, DownloadContext, DownloadedVideo } from "./base";
import { Video, Playlist } from "../music/media";
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
        await ctx.log("fetching info using yt-dlp...");
        const args = [ "-J", '--no-warnings', url ];
        const cookies = process.env.PATH_TO_COOKIES ? true : false;
        if (cookies) {
            args.push("--cookies", process.env.PATH_TO_COOKIES || "");
        }
        const info = await this._runYtDlp(args, ctx);
        if (!info) return null;

        // Playlist
        try {
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
                info.description?.slice(0, 400) + info.description?.length > 400 ? "..." : "",
                info.uploader,
                undefined,
                "yt-dlp"
            );
        } catch (err: any) {
            await ctx.log(`failed to parse yt-dlp output: ${err?.message || err}`);
            return null;
        }
    }

    /**
     * Download a single video as webm audio.
     * Returns Video object with filePath, or null on error.
     * Playlists are not downloaded.
     */
    async download(info: Video, ctx: DownloadContext): Promise<DownloadedVideo | null> {
        const url = info.url;
        await ctx.log("fetching info for download using yt-dlp...");
        if (!info || info instanceof Playlist) {
            await ctx.log("cannot download playlists, only single videos are supported.");
            return null;
        }
        const filePath = path.join("cache/ytdl", sanitize(info.title + info.url) + ".mp3");
        const downloadedInfo: DownloadedVideo = { ...info, filePath };

        try {
            await fs.mkdir("cache/ytdl", { recursive: true });
            try {
                await fs.access(filePath);
                await ctx.log(`file already exists at \`${filePath}\`, skipping download.`);
                return downloadedInfo;
            } catch { /* Not cached, continue */ }

            await ctx.log("downloading with yt-dlp...");
            const args = [
                "-x",
                "-f", "bestaudio/best",
                "--no-warnings",
                "--extract-audio",
                "--audio-format", "mp3",
                "--limit-rate", "2048k",
                "-o", filePath,
                url
            ];
            const cookies = process.env.PATH_TO_COOKIES ? true : false;
            if (cookies) {
                args.push("--cookies", process.env.PATH_TO_COOKIES || "");
            }
            await this._runYtDlp(args, ctx, true);
            await this._runYtDlp(args, ctx, true);
            await ctx.log("download complete!");
            return downloadedInfo;
        } catch (err: any) {
            await ctx.log(`download failed: ${err?.message || err}`);
            return null;
        }
    }
    // infoOnly disables logging stdout for download, only logs errors
    private async _runYtDlp(args: string[], ctx: DownloadContext, infoOnly = false): Promise<any> {
        return new Promise(resolve => {
            const proc = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
            let output = "";
            let errorOutput = "";
            let downloadProgressCount = 0;
            let downloadLogCounter = 0;

            proc.stdout.on("data", async (chunk) => {
                const msg = chunk.toString();
                log.debug(msg);
                if (msg.trim().startsWith("[download]")) {
                    const progress = msg.match(/(\d+(\.\d+)?)%/);
                    const fileSize = msg.match(/(?:\d+(?:\.\d+)?)% of +(\d+(?:\.\d+)?)MiB/);
                    if (progress) {
                        const percent = parseFloat(progress[1]);
                        downloadLogCounter++;
                        if (downloadLogCounter % 3 === 0 && percent > downloadProgressCount) {
                            downloadProgressCount = percent;
                            await ctx.editLatest(`downloading: ${percent}% of ${fileSize ? fileSize[1] : "unknown"} MiB`);
                        }
                    }
                }
                output += msg;
            });
            proc.stderr.on("data", async (chunk) => {
                const msg = chunk.toString();
                if (msg.trim().length > 0) await ctx.log(msg);
                errorOutput += msg;
            });
            proc.on("close", async (code) => {
                if (code !== 0 && !infoOnly) {
                    await ctx.log(`yt-dlp exited with code ${code}`);
                    resolve(null);
                } else {
                    try {
                        resolve(output ? JSON.parse(output) : undefined);
                    } catch (err: any) {
                        if (!infoOnly) await ctx.log(`yt-dlp output parse failure: ${err?.message || err}`);
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