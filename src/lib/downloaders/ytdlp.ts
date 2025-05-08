import { Playlist, Video } from "../classes/queue";
import { DownloaderPromise } from "./types";
import { spawn } from "node:child_process";
import { fixFileName } from "../attachment_manager";
import fs from "fs";
import path from "path";
import { Downloader } from "./router";

const error_messages: Record<string, string> = {
    "is not a valid URL.": "invalid url",
    "Unsupported URL": "unsupported url",
    "Use --cookies-from-browser or --cookies for the authentication. See  https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp  for how to manually pass cookies. Also see  https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies  for tips on effectively exporting YouTube cookies": "internal error: yt-dlp has not been passed required cookies. ",
    "Requested format is not available. Use --list-formats for a list of available formats": "this website does not provide an audio only format",
    "Error 403: rate limit exceeded": "rate limit exceeded",
    "Error 429: Too Many Requests": "rate limit exceeded",
    "Error 404: Not Found": "video not found",
    "Error 410: Gone": "video has been removed",
}

function getErrorFromStderr(stderr: string): string {
    for (const key in error_messages) {
        if (stderr.includes(key)) {
            return error_messages[key];
        }
    }
    return stderr;
}

export function parseLength(length: string): number {
    var p = length.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop() || "0", 10);
        m *= 60;
    }

    return s;
}

export async function getInfo(url: string, { log, resolve, reject }: DownloaderPromise) {
    log(`getting video info with yt-dlp...`);
    const command = `yt-dlp`;
    const args = [
        '--skip-download',
        '--no-warnings',
        '--get-title',
        '--get-duration',
        '--get-id',
        '--get-url',
        '--get-thumbnail',
        '--flat-playlist',
    ]
    const cookies = process.env.PATH_TO_COOKIES ? true : false;
    if (cookies) {
        args.push("--cookies", process.env.PATH_TO_COOKIES || "");
    }
    args.push(url);
    let errored = false;
    const stdout = await new Promise<string>((resolve, reject) => {
        let out = "";
        const child = spawn(command, args);
        child.on("error", (err) => { reject(err); });
        child.stderr.on("data", (data) => { reject(data.toString()); });
        child.stdout.on("data", (data) => { out += data.toString(); });
        child.on("exit", () => { resolve(out); });
    }).catch((err) => {
        errored = true;
        reject(getErrorFromStderr(err));
    })
    if (errored) {
        return;
    }
    if (!stdout) {
        reject("failed to get video info; stdout is empty");
        return;
    }
    const lines = stdout.split('\n').filter((line) => line !== "" && !line.startsWith("WARNING:") && !line.startsWith("[download]"));

    if (lines.length < 8) { // for some odd reason, some websites return multiple urls from --get-url? this probably isn't a catch all solution but i have zero fuckin clue what else to do
        const title = lines[0];
        const id = lines[1];
        const thumbnail = lines[lines.length - 2]
        const length = lines[lines.length - 1];
        if (!title || !id || !length || !url) {
            reject("failed to get video info; stdout split returned an array with less than 3 elements");
            return;
        }
        const video = new Video(url);
        video.title = title;
        video.length = parseLength(length) || undefined;
        if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
            video.thumbnailUrl = thumbnail;
        } else {
            video.thumbnailUrl = false;
        }
        video.id = id;
        video.fetched = true;
        video.fetcher = Downloader.ytdlp;
        resolve(video)
        return;
    }

    const segments = lines.map((_, i) => {
        const segment = lines.slice(i, i + 4);
        const urlLine = segment.find(line => /^https?:\/\//.test(line));
        const timeLine = segment.find(line => /^\d+:\d+$/.test(line));
        if (urlLine) {
            segment[2] = urlLine;
        }
        if (timeLine) {
            segment[3] = timeLine;
        }
        return segment;
    }).filter((_, i) => i % 4 === 0);

    if (segments.length > 1) {
        const playlist = new Playlist(url);
        segments.forEach(([title, id, url, length]) => {
            if (!title || !id || !url || !length) {
                if (playlist.items?.length === 0) {
                    reject("failed to get video info; stdout split returned an array with less than 4 elements");
                    return;
                } else {
                    return;
                }
            }
            const video = new Video(url);
            video.title = title;
            video.length = parseLength(length) || undefined;
            if (video.url.includes("youtube")) {
                video.thumbnailUrl = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
            } else {
                video.thumbnailUrl = false;
            }
            video.id = id;
            if (!playlist.items) {
                playlist.items = [];
            }
            video.fetched = true;
            video.fetcher = Downloader.ytdlp;
            playlist.items.push(video);
        });
        playlist.fetched = true;
        resolve(playlist);
    }
}

export async function download(video: Video, { log, resolve, reject }: DownloaderPromise) {
    log(`downloading \`${video.title}\` with yt-dlp...`);
    const cacheDir = path.resolve(__dirname, "../../../cache/ytdl");
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filePath = path.join(cacheDir, `${fixFileName(video.title || "")}_${video.id}.mp3`);
    const archivePath = path.join(cacheDir, 'archive.txt');
    const command = `yt-dlp`;
    const cookies = process.env.PATH_TO_COOKIES ? true : false;
    const args = [
        '-f', 'bestaudio/best',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--no-playlist',
        '--download-archive', archivePath,
        '--limit-rate', '250k',
        '-o', filePath,
    ];
    if (cookies) {
        args.push("--cookies", process.env.PATH_TO_COOKIES || "");
    }
    args.push(video.url);

    let errored = false;
    const stdout = await new Promise<string>((resolve, reject) => {
        let out = "";
        const child = spawn(command, args);
        child.on("error", (err) => { reject(err); });
        child.stderr.on("data", (data) => { reject(data.toString()); });
        child.stdout.on("data", (data) => { out += data.toString(); });
        child.on("exit", () => { resolve(out); });
    }).catch((err) => {
        errored = true;
        reject(getErrorFromStderr(err));
    })
    if (errored) {
        return;
    }

    video.file = filePath;
    video.downloaded = true;
    video.downloader = Downloader.ytdlp;

    resolve(video);
}