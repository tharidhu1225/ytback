# YouTube Downloader Backend (Educational)


> ⚠️ **Disclaimer**: Downloading YouTube content may violate YouTube's Terms of Service unless the content owner has granted permission or YouTube provides a download button. This project is for educational/testing use only.


## Features
- Get video info: title, thumbnails, available MP4 qualities, audio tracks
- Stream **MP4** download (progressive formats)
- Convert to **MP3** on the fly using FFmpeg
- Rate limiting, CORS, security headers, compression
- Dockerfile with ffmpeg preinstalled


## Requirements
- Node.js 18+ (works great on Node 20)
- FFmpeg installed and available in PATH
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt-get update && sudo apt-get install -y ffmpeg`
- **Windows (choco)**: `choco install ffmpeg`


## Setup
```bash
git clone <your-repo> yt-downloader-backend
cd yt-downloader-backend
npm i
cp .env.example .env
# (edit .env if needed)
```


### Run (Dev)
```bash
npm run dev
```


### Run (Prod)
```bash
npm run start
```


### Using Docker
```bash
docker build -t yt-downloader-backend .
docker run -p 5000:5000 --name yt-downloader yt-downloader-backend
```


## API


### Health
`GET /health`
- Response: `{ "status": "ok" }`


### Get Info
`GET /api/info?url=<youtube_url>`
- Response example:
```json
{
"id": "dQw4w9WgXcQ",
"title": "...",
"author": "...",
"lengthSeconds": 213,
"thumbnails": [...],
"url": "...",
"mp4": [{ "itag": 22, "quality": "720p", "container": "mp4", "approxSize": 12345678 }],
"audio": [{ "itag": 140, "mimeType": "audio/mp4; codecs=\"mp4a.40.2\"", "abr": 128 }]
}
```


### Download MP4
`GET /api/download/mp4?url=<youtube_url>&itag=<optional_itag>`
- If `itag` omitted, server chooses highest progressive MP4 available.


### Download MP3
`GET /api/download/mp3?url=<youtube_url>&abr=<optional_kbps>`
- `abr` defaults to `192` (kbps). Example: `abr=128` or `abr=320`.


## Notes
- Some videos do not provide progressive MP4 at high resolutions; you may only get 360p/720p with audio. Higher resolutions are often video-only; muxing would require downloading separate audio+video and merging with ffmpeg (not implemented here to keep it simple).
- For heavy traffic, consider a job queue (BullMQ + Redis) and temporary file caching.