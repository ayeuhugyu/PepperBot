import { DownloaderBase, DownloadContext, DownloadedVideo } from "./base";
import { Video, Playlist } from "../music/media";
import * as log from "../log"
import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";

const urlRegex = /https?:\/\/music\.apple\.com\/\w+\/(?:album|playlist|song)\/[\w-]+\/(?:\d+|pl\.[\w\-]+)(?:\?i=\d+)?/g // should match all of the links below
const idGatheringRegex = {
    track: /https?:\/\/music\.apple\.com\/\w+\/(?:album)\/[\w-]+\/(?:\d+)\?i=(\d+)/, // should match https://music.apple.com/us/album/new-noise-resolutionz/1765212414?i=1765212428
    song: /https?:\/\/music\.apple\.com\/\w+\/(?:song)\/[\w-]+\/(\d+)/,
    album: /https?:\/\/music\.apple\.com\/\w+\/(?:album)\/[\w-]+\/(\d+)/, // should match https://music.apple.com/us/album/pizza-tower-original-game-soundtrack-bonus-tracks/1765212414
    playlist: /https?:\/\/music\.apple\.com\/\w+\/(?:playlist)\/[\w-]+\/(pl\.[\w\-]+)/, // should match https://music.apple.com/us/playlist/fast-swing-like-songs/pl.u-zPyLmZYFZy503Nl
}

function getIdAndMediaType(url: string) {
    const trackMatch = url.match(idGatheringRegex.track);
    const songMatch = url.match(idGatheringRegex.song);
    const albumMatch = url.match(idGatheringRegex.album);
    const playlistMatch = url.match(idGatheringRegex.playlist);

    log.debug("amdl matches: ", trackMatch, albumMatch, playlistMatch);

    if (trackMatch) {
        log.debug("amdl track match found: ", trackMatch[1]);
        return { id: trackMatch[1], mediaType: AppleMusicMediaType.Track };
    } else if (songMatch) {
        log.debug("amdl track match (using song regex) found: ", songMatch[1]);
        return { id: songMatch[1], mediaType: AppleMusicMediaType.Track };
    } else if (albumMatch) {
        log.debug("amdl album match found: ", albumMatch[1]);
        return { id: albumMatch[1], mediaType: AppleMusicMediaType.Album };
    } else if (playlistMatch) {
        log.debug("amdl playlist match found: ", playlistMatch[1]);
        return { id: playlistMatch[1], mediaType: AppleMusicMediaType.Playlist };
    }
    return null;
}

enum AppleMusicMediaType {
    Track = "track",
    Album = "album",
    Playlist = "playlist",
}

const baseUrl = "https://amdl.reidlab.pink/api/"

function trackToVideo(track: any): Video {
    return new Video(
        track.attributes.url,
        track.attributes.name,
        Math.floor(track.attributes.durationInMillis / 1000),
        track.attributes.artwork.url.replace("{w}x{h}", "512x512"),
        `\n     album: ${track.attributes.albumName} \n     release date: ${track.attributes.releaseDate}`,
        track.attributes.artistName,
        undefined,
        "amdl",
    );
}

export class AppleMusicDownloader extends DownloaderBase {
    getPriority(url: string) {
        if (url.match(urlRegex)) {
            return 10;
        }
        return 0;
    }
    async getInfo(url: string, ctx: DownloadContext): Promise<Video | Playlist | null> {
        const match = getIdAndMediaType(url);
        if (!match) {
            await ctx.log("**url does not match regex**");
            return null;
        }
        const id = match.id;
        const mediaType = match.mediaType;
        if (!id) {
            await ctx.log("**couldn't extract id from url**");
            return null;
        }
        if (mediaType === AppleMusicMediaType.Track) {
            await ctx.log("fetching track metadata using apple music downloader (AMDL)...");
            const response = await fetch(baseUrl + "getTrackMetadata?id=" + id);
            if (!response.ok) {
                await ctx.log("failed to fetch track metadata; status: " + response.status);
                return null;
            }
            const json = await response.json();
            if (!json) {
                await ctx.log("**failed to parse track metadata**");
                return null;
            }
            let video: Video;
            try {
                const data = json.data[0];
                video = trackToVideo(data);
            } catch (e) {
                await ctx.log("**failed to parse track metadata: " + e + "**");
                return null;
            }

            if (!video) {
                await ctx.log("**failed to parse track metadata**");
                return null;
            }
            return video;
        }
        if (mediaType === AppleMusicMediaType.Album || mediaType === AppleMusicMediaType.Playlist) {
            await ctx.log("fetching album metadata using apple music downloader (AMDL)...");
            const response = await fetch(baseUrl + (mediaType === AppleMusicMediaType.Album ? "getAlbumMetadata" : "getPlaylistMetadata") + "?id=" + id);
            if (!response.ok) {
                await ctx.log("failed to fetch album metadata; status: " + response.status);
                return null;
            }
            const json = await response.json();
            if (!json) {
                await ctx.log("**failed to parse album metadata**");
                return null;
            }
            let playlist: Playlist;
            try {
                const data = json.data[0];
                const videos: Video[] = data.relationships.tracks.data.map(trackToVideo);
                let artworkUrl = data.attributes.artwork?.url?.replace("{w}x{h}", "512x512");
                if (!artworkUrl) {
                    const firstTrack = data.relationships.tracks.data[0];
                    if (firstTrack) {
                        artworkUrl = firstTrack.attributes.artwork?.url?.replace("{w}x{h}", "512x512");
                    }
                }
                playlist = new Playlist(
                    data.attributes.url,
                    data.attributes.name,
                    videos,
                    artworkUrl,
                    undefined,
                    "artistName" in data.attributes ? data.attributes.artistName : data.attributes.creatorName,
                    "amdl",
                );
            } catch (e) {
                await ctx.log("**failed to parse album metadata: " + e + "**");
                return null;
            }

            if (!playlist) {
                await ctx.log("**failed to parse album metadata**");
                return null;
            }
            return playlist;
        }
        await ctx.log("**failed to fetch track metadata; media type not found**");
        return null;
    }
    async download(info: Video, ctx: DownloadContext): Promise<DownloadedVideo | null> {
        const outputDir = "cache/amdl";
        const id = idGatheringRegex.track.exec(info.url)?.[1];
        if (!id) {
            await ctx.log("**url does not match track regex**");
            return null;
        }
        const fileName = sanitize(info.title) + id + ".m4a";
        const filePath = path.join(outputDir, fileName);

        // Check if file already exists
        try {
            await fs.access(filePath);
            await ctx.log(`file already exists at \`${filePath}\`, skipping download`);
            info.filePath = filePath;
            return info as DownloadedVideo;
        } catch {
            // File does not exist, continue to download
        }

        await ctx.log("downloading track using apple music downloader (AMDL)...");
        const response = await fetch(baseUrl + "download?codec=aac_he_legacy&id=" + id);
        if (!response.ok || !response.body) {
            await ctx.log("**failed to fetch track download url; status: " + response.status + "**");
            return null;
        }

        const reader = response.body.getReader();
        const { value: firstChunk, done } = await reader.read();

        await fs.mkdir(outputDir, { recursive: true });

        // Use Node.js streams to pipe the response body to the file
        const fileStream = createWriteStream(filePath);

        // Convert the web ReadableStream to a Node.js stream and pipe to file
        const stream = require('stream');
        const { finished } = require('stream/promises');
        return new Promise<DownloadedVideo | null>(async (resolve) => {
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
                resolve(info as DownloadedVideo);
            } catch (err: any) {
                await ctx.log("**error writing file: " + err + "**");
                try { await fs.unlink(filePath); } catch {}
                resolve(null);
            }
        });
    }
}

function sanitize(str: string) {
    return str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}