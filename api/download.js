const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
  try {
    const { url, quality, format } = req.query;

    if (!url || !quality || !format) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const videoFormat = format === 'mp3' ? 'audioonly' : 'video';
    const stream = ytdl(url, { quality, filter: videoFormat });

    res.setHeader('Content-Disposition', `attachment; filename="video.${format}"`);
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
