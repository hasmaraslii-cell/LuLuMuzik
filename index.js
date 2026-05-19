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
        return res.status(400).send('Hata: url parametresi girilmedi.');
    }

    console.log("İstek geldi, URL:", spotifyUrl);

    try {
        // Spotify linkinden bilgileri çekiyoruz
        const trackData = await getPreview(spotifyUrl).catch(err => {
            throw new Error("Spotify linki çözülemedi. Link hatalı olabilir veya Spotify engelledi.");
        });

        if (!trackData || !trackData.title) {
            return res.status(400).send('Hata: Spotify şarkı bilgileri alınamadı.');
        }

        const aramaSorgusu = `${trackData.title} ${trackData.artist}`;
        console.log("Aranan Şarkı:", aramaSorgusu);

        // YouTube araması
        const r = await yts(aramaSorgusu);
        const videos = r.videos;
        
        if (videos && videos.length > 0) {
            const videoUrl = videos[0].url;
            console.log("YouTube Kaynağı:", videoUrl);

            // Response başlıklarını ayarla
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Accept-Ranges', 'bytes');

            // ytdl akışını hata yakalayıcı ile başlatıyoruz
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            // Akış esnasında oluşabilecek YouTube engellerini yakala (Sunucu çökmesini önler)
            stream.on('error', (streamErr) => {
                console.error("Akış hatası:", streamErr.message);
                if (!res.headersSent) {
                    res.status(500).send("YouTube Akış Hatası: " + streamErr.message);
                }
            });

            stream.pipe(res);

        } else {
            res.status(404).send('Hata: YouTube üzerinde uygun ses bulunamadı.');
        }

    } catch (error) {
        console.error("Yakalanamayan Hata:", error.message);
        // Sunucu çökmesin diye yanıtı güvenli şekilde dönüyoruz
        if (!res.headersSent) {
            res.status(500).send('Sistem Hatası: ' + error.message);
        }
    }
});

// Sunucunun global çökmesini engelleyen acil durum freni
process.on('uncaughtException', (err) => {
    console.error('Yakalanamayan Kritik Hata:', err.message);
});

app.listen(PORT, () => {
    console.log(`LuLu Sunucusu ${PORT} üzerinde yayında.`);
});
