import { Video, Playlist } from "../music/media";

export interface DownloadContext {
    editLatest: (msg: string) => void;
    log: (msg: string) => void;
}

/**
 * This type is used to represent a downloaded video. The only difference between it and a regular video is that the `filePath` property is required.
 * This is used to indicate that the video has been downloaded and is ready to be played.
 * The `filePath` property is the path to the downloaded file.
 */
export type DownloadedVideo = (Video & { filePath: string }) | null;
export abstract class DownloaderBase {
    /**
     * Return 0 if you cannot handle the URL, >0 for "can handle". Higher = more preferred.
     */
    abstract getPriority(url: string): number;
    abstract getInfo(url: string, ctx: DownloadContext): Promise<Video | Playlist | null>;
    abstract download(info: Video, ctx: DownloadContext): Promise<DownloadedVideo | null>;
}

export class DownloaderRegistry {
    private downloaders: DownloaderBase[] = [];
    register(dl: DownloaderBase) { this.downloaders.push(dl); }
    getDownloader(url: string): DownloaderBase | null {
        let best: { dl: DownloaderBase, prio: number } | null = null;
        for (const dl of this.downloaders) {
            const prio = dl.getPriority(url);
            if (prio > 0 && (!best || prio > best.prio)) best = { dl, prio };
        }
        return best?.dl ?? null;
    }
}