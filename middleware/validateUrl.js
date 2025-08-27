import ytdl from "@distube/ytdl-core";


const ALLOWED_HOSTS = new Set([
'www.youtube.com', 'youtube.com', 'm.youtube.com',
'music.youtube.com', 'youtu.be'
]);


export function validateYouTubeUrl(req, res, next) {
const url = req.query.url;
if (!url) return res.status(400).json({ error: 'Missing url query parameter' });


try {
const u = new URL(url);
if (!ALLOWED_HOSTS.has(u.hostname)) {
return res.status(400).json({ error: 'URL must be a YouTube link' });
}
} catch (e) {
return res.status(400).json({ error: 'Invalid URL format' });
}


if (!ytdl.validateURL(url)) {
return res.status(400).json({ error: 'Invalid or unsupported YouTube URL' });
}
return next();
}