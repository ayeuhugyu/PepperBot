import { Video, Playlist } from "./media";

export interface DownloadContext {
    log: (msg: string) => void;
}

export abstract class DownloaderBase {
    /**
     * Return 0 if you cannot handle the URL, >0 for "can handle". Higher = more preferred.
     */
    abstract getPriority(url: string): number;
    abstract getInfo(url: string, ctx: DownloadContext): Promise<Video | Playlist | null>;
    abstract download(info: Video, ctx: DownloadContext): Promise<Video | null>;
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