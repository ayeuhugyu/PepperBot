import { DownloadedVideo, DownloaderRegistry } from "./base";
import { YtDlpDownloader } from "./ytdlp";
// import { ExampleDownloader } from "./example";
import * as realLog from "../log"
import { Video } from "../music/media";
import { AppleMusicDownloader } from "./amdl";

const registry = new DownloaderRegistry();
registry.register(new YtDlpDownloader());
registry.register(new AppleMusicDownloader());
// registry.register(new ExampleDownloader());

export async function fetchMediaInfo(url: string, log: (msg: string) => void, editLatest: (msg: string) => void) {
    const downloader = registry.getDownloader(url);
    if (!downloader) {
        log("No suitable downloader found for this URL.");
        return null;
    }
    log(`fetching info with downloader: ${downloader.constructor.name}`);
    const data = await downloader.getInfo(url, { log, editLatest });
    realLog.debug(`Fetched media info`, data);
    return data;
}

export async function downloadMedia(video: Video, log: (msg: string) => void, editLatest: (msg: string) => void): Promise<DownloadedVideo | null> {
    const downloader = registry.getDownloader(video.url);
    if (!downloader) {
        log("No suitable downloader found for this URL.");
        return null;
    }
    log(`downloading file with downloader: ${downloader.constructor.name}`);
    return await downloader.download(video, { log, editLatest })
}