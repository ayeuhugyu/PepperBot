export class Video {
    constructor(
        public url: string,
        public title: string,
        public duration: number, // seconds
        public thumbnail?: string,
        public description?: string,
        public uploader?: string,
        public filePath?: string,
        public downloader?: string // e.g. 'yt-dlp'
    ) {}
}

export type DownloadResult = (Video & { filePath: string }) | null;

export class Playlist {
    constructor(
        public url: string,
        public title: string,
        public videos: Video[],
        public thumbnail?: string,
        public description?: string,
        public uploader?: string,
        public downloader?: string // e.g. 'yt-dlp'
    ) {}
}