import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import NodeCache from 'node-cache';
import contentDisposition from 'content-disposition';

const cache = new NodeCache({ stdTTL: 6 * 60 * 60 }); // 6 hours cache

function sanitizeFilename(input, fallback = 'download') {
  return (input || fallback)
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/["']/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || fallback;
}

export async function getInfo(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url query parameter' });

  try {
    const cached = cache.get(url);
    if (cached) return res.json(cached);

    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    const progressive = info.formats.filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4');
    const audioOnly = info.formats.filter(f => f.hasAudio && !f.hasVideo);

    const data = {
      id: details.videoId,
      title: details.title,
      author: details.author?.name,
      lengthSeconds: Number(details.lengthSeconds || 0),
      thumbnails: details.thumbnails || [],
      url,
      mp4: progressive
        .filter(f => f.qualityLabel)
        .map(f => ({
          itag: f.itag,
          quality: f.qualityLabel,
          container: f.container,
          approxSize: f.contentLength ? Number(f.contentLength) : null,
          bitrate: f.bitrate || null,
        }))
        .sort((a, b) => parseInt(b.quality) - parseInt(a.quality)),
      audio: audioOnly.map(f => ({
        itag: f.itag,
        mimeType: f.mimeType,
        abr: f.audioBitrate,
        audioCodec: f.codecs,
      })),
    };

    cache.set(url, data);
    return res.json(data);
  } catch (err) {
    console.error('getInfo error:', err.message || err);
    return res.status(500).json({ error: 'Failed to fetch video info' });
  }
}

export async function downloadMp4(req, res) {
  try {
    const { url, itag } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url query parameter' });

    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title, 'video');

    const format = itag
      ? ytdl.chooseFormat(info.formats, { quality: itag })
      : ytdl.chooseFormat(info.formats.filter(f => f.hasVideo && f.hasAudio), 'highest');

    if (!format || format.container !== 'mp4') {
      return res.status(400).json({ error: 'MP4 format not available for this video' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', contentDisposition(`${title}.mp4`));

    const stream = ytdl.downloadFromInfo(info, { quality: itag || 'highest', filter: 'audioandvideo' });

    stream.on('error', e => {
      console.error('MP4 stream error:', e.message || e);
      if (!res.headersSent) res.status(500).json({ error: 'Streaming error' });
      else res.destroy(e);
    });

    stream.pipe(res);
  } catch (err) {
    console.error('downloadMp4 error:', err.message || err);
    return res.status(500).json({ error: 'Failed to start MP4 download' });
  }
}

export async function downloadMp3(req, res) {
  try {
    const { url, abr } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url query parameter' });

    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title, 'audio');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', contentDisposition(`${title}.mp3`));

    const audioStream = ytdl.downloadFromInfo(info, { quality: 'highestaudio', filter: 'audioonly' });

    const command = ffmpeg()
      .input(audioStream)
      .audioBitrate(abr ? parseInt(abr) : 192)
      .toFormat('mp3')
      .on('error', e => {
        console.error('FFmpeg error:', e.message || e);
        if (!res.headersSent) res.status(500).json({ error: 'Conversion error' });
        else res.destroy(e);
      })
      .on('end', () => {});

    command.pipe(res, { end: true });
  } catch (err) {
    console.error('downloadMp3 error:', err.message || err);
    return res.status(500).json({ error: 'Failed to start MP3 download' });
  }
}
