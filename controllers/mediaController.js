import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import NodeCache from 'node-cache';
import contentDisposition from 'content-disposition';
import { sanitizeFilename } from '../utils/filename.js';

const cache = new NodeCache({ stdTTL: 86400 }); // 24 hours

export async function getInfo(req, res) {
  const { url } = req.query;
  const cached = cache.get(url);
  if (cached) {
    console.log(`Cache hit for: ${url}`);
    return res.json(cached);
  }

  try {
    const info = await ytdl.getInfo(url);
    const d = info.videoDetails;
    const progressive = info.formats.filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4');
    const audioOnly = info.formats.filter(f => f.hasAudio && !f.hasVideo);
    const data = {
      id: d.videoId,
      title: d.title,
      author: d.author?.name,
      lengthSeconds: +d.lengthSeconds || 0,
      thumbnails: d.thumbnails || [],
      url,
      mp4: progressive.filter(f => f.qualityLabel).map(f => ({
        itag: f.itag,
        quality: f.qualityLabel,
        container: f.container,
        approxSize: f.contentLength ? +f.contentLength : null,
        bitrate: f.bitrate || null
      })).sort((a, b) => parseInt(b.quality) - parseInt(a.quality)),
      audio: audioOnly.map(f => ({
        itag: f.itag,
        mimeType: f.mimeType,
        abr: f.audioBitrate,
        audioCodec: f.codecs
      }))
    };
    cache.set(url, data);
    return res.json(data);
  } catch (err) {
  console.error('getInfo error:', err?.message);

  // 🛠️ Add 429 handler
  if (err.statusCode === 429) {
    return res.status(429).json({
      error: 'YouTube is rate-limiting this server. Try again later.'
    });
  }

  return res.status(500).json({ error: 'Failed to fetch video info' });
}
}

export async function downloadMp4(req, res) {
  const { url, itag } = req.query;
  try {
    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title, 'video');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', contentDisposition(`${title}.mp4`));

    const stream = ytdl.downloadFromInfo(info, {
      quality: itag || 'highest',
      filter: 'audioandvideo'
    });
    stream.on('error', e => {
      console.error('MP4 stream error:', e.message);
      !res.headersSent ? res.status(500).json({ error: 'Streaming error' }) : res.destroy(e);
    });
    stream.pipe(res);
  } catch (err) {
    console.error('downloadMp4 error:', err.message);
    res.status(500).json({ error: 'Failed to start MP4 download' });
  }
}

export async function downloadMp3(req, res) {
  const { url, abr } = req.query;
  try {
    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title, 'audio');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', contentDisposition(`${title}.mp3`));

    const audioStream = ytdl.downloadFromInfo(info, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    const command = ffmpeg()
      .input(audioStream)
      .audioBitrate(abr ? +abr : 192)
      .toFormat('mp3')
      .on('error', e => {
        console.error('FFmpeg error:', e.message);
        !res.headersSent ? res.status(500).json({ error: 'Conversion error' }) : res.destroy(e);
      });

    command.pipe(res, { end: true });
  } catch (err) {
    console.error('downloadMp3 error:', err.message);
    res.status(500).json({ error: 'Failed to start MP3 download' });
  }
}
