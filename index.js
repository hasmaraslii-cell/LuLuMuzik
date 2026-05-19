const express = require('express');
const { getPreview } = require('spotify-url-info')(fetch);
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('LuLu Müzik API Aktif ve Çalışıyor!');
});

app.get('/stream', async (req, res) => {
    let spotifyUrl = req.query.url;
    
    if (!spotifyUrl) {
        return res.status(400).send('Hata: URL parametresi eksik.');
    }

    try {
        console.log("Gelen gerçek link:", spotifyUrl);
        
        // Spotify linkinden şarkı verilerini çekiyoruz
        const trackData = await getPreview(spotifyUrl);
        const aramaSorgusu = `${trackData.title} ${trackData.artist}`;
        console.log("Çözülen Şarkı:", aramaSorgusu);

        // YouTube üzerinde temiz ses araması yapıyoruz
        const r = await yts(aramaSorgusu);
        const videos = r.videos;
        
        if (videos.length > 0) {
            const videoUrl = videos[0].url;
            console.log("Ses kaynağı bulundu:", videoUrl);

            // Sesi canlı akış (Stream) olarak uygulamaya basıyoruz
            res.setHeader('Content-Type', 'audio/mpeg');
            ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }).pipe(res);

        } else {
            res.status(404).send('Şarkı sesi bulunamadı.');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Sistem Hatası: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`LuLu Sunucusu ${PORT} üzerinde yayında.`);
});
