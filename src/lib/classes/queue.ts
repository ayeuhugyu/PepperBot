import { Downloader } from "../downloaders/router";

export class Video {
    url: string;

    title: string | undefined = undefined; // string if fetched, undefined if not
    length: number | undefined = undefined; // number (in seconds) if fetched, undefined if not
    thumbnailUrl: string | false | undefined = undefined; // string if found, false if not found, undefined if not fetched
    id: string | undefined = undefined; // string if fetched, undefined if not
    fetched: boolean = false; // determines types of above values

    file: string | undefined = undefined; // undefined if not downloaded, string to file path if downloaded
    downloaded: boolean = false; // determines above value

    fetcher: Downloader | undefined = undefined; // undefined if not fetched, Downloader if fetched
    downloader: Downloader | undefined = undefined; // undefined if not downloaded, Downloader if downloaded

    constructor(url: string) {
        this.url = url;
    }

    static fromRaw(data: Partial<Video>) {
        if (!data.url) {
            throw new Error(`can't convert raw data to video without url`);
        }
        const video = new Video(data.url);
        if (data.fetched) {
            video.fetched = data.fetched;
            video.title = data.title;
            video.length = data.length;
            video.thumbnailUrl = data.thumbnailUrl || false;
        }
        if (data.downloaded) {
            video.downloaded = data.downloaded;
            video.file = data.file;
        }

        return Video;
    }
}

export class Playlist {
    url: string;

    items: Video[] | undefined = [];
    fetched: boolean = false; // determines types of above values

    constructor(url: string) {
        this.url = url;
    }

    static fromRaw(data: Partial<Playlist>) {
        if (!data.url) {
            throw new Error(`can't convert raw data to playlist without url`);
        }
        const playlist = new Playlist(data.url);
        if (data.fetched) {
            playlist.fetched = data.fetched;
            playlist.items = data.items || [];
        }

        return Playlist;
    }
}