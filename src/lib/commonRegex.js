export default {
    youtubeURL: /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/,
    ISO8601: /P(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/,
    ipv4regex: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
    deepwokenBuildLink: /https:\/\/deepwoken\.co\/builder\?id=([a-zA-Z0-9]+)/,
    discord: {
        role: /<@&\d+>/g,
        user: /<@\d+>/g,
        channel: /<#\d+>/g,
        emoji: /<a?:\w+:\d+>/g,
    },
}