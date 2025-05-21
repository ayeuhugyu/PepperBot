import { fetchMediaInfo, downloadMedia } from "../src/lib/downloaders";
import { Video, Playlist } from "../src/lib/downloaders/media";

const url = "hielkemaps.com/media/video/clip.mp4";

async function testDownloader() {
    console.log("Fetching media info...");
    const info = await fetchMediaInfo(url, (msg) => process.stdout.write(`[INFO] ${msg}\n`));

    if (!info) {
        console.error("Failed to fetch media info!");
        return;
    }

    if (info instanceof Playlist) {
        console.log(`Fetched playlist: "${info.title}" with ${info.videos.length} items.`);
        console.dir(info, { depth: 4 });
        // Use the first video from the playlist for download
        if (!info.videos[0]) {
            console.error("Playlist is empty!");
            return;
        }
        console.log("Attempting to download first video in playlist...");
        const video = await downloadMedia(info.videos[0], (msg) => process.stdout.write(`[DL] ${msg}\n`));
        if (!video) {
            console.error("Failed to download video from playlist!");
            return;
        }
        console.log("Downloaded first video from playlist:");
        console.dir(video, { depth: 4 });
    } else if (info instanceof Video) {
        console.log(`Fetched video: "${info.title}"`);
        console.dir(info, { depth: 4 });
        console.log("Attempting to download video...");
        const downloaded = await downloadMedia(info, (msg) => process.stdout.write(`[DL] ${msg}\n`));
        if (!downloaded) {
            console.error("Failed to download video!");
            return;
        }
        console.log("Downloaded video:");
        console.dir(downloaded, { depth: 4 });
    } else {
        console.error("Unknown object returned by fetchMediaInfo:", info);
    }
}

testDownloader().catch(e => {
    console.error("Test script errored:", e);
    process.exit(1);
});