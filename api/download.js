const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
    try {
        const { url, quality, format } = req.query;

        if (!url ||!quality ||!format) {
            return res.status(400).json({ error: 'Missing required parameters', errorCode: 'MISSING_PARAMETERS' });
        }

        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL', errorCode: 'INVALID_URL' });
        }

        const info = await ytdl.getInfo(url);

        let chosenFormat;
        if (format === 'mp3') {
            chosenFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        } else {
            chosenFormat = ytdl.chooseFormat(info.formats, { quality, filter: 'videoandaudio' }); // Or 'videoonly' if needed
        }

        if (!chosenFormat) {
            return res.status(400).json({ error: 'Requested quality/format not available', errorCode: 'FORMAT_NOT_AVAILABLE' });
        }

        const stream = ytdl(url, { format: chosenFormat });

        const filename = `${info.videoDetails.title}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Type', chosenFormat.mimeType);

        if (chosenFormat.contentLength) {
            res.setHeader('Content-Length', chosenFormat.contentLength);
        } else {
            console.warn('Content length is not available.');
        }

        stream.pipe(res);

        stream.on('error', (err) => {
            console.error('Download stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Download failed', errorCode: 'DOWNLOAD_ERROR', details: err.message });
            }
        });

        stream.on('finish', () => {
            console.log('Download finished successfully.');
        });

    } catch (error) {
        console.error('General error:', error);
        res.status(500).json({ error: 'An error occurred', errorCode: 'GENERAL_ERROR', details: error.message });
    }
};
