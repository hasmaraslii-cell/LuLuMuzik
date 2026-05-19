const express = require('express');
const play = require('play-dl');
const app = express();
const PORT = process.env.PORT || 3000;

// Sunucunun çalıştığını doğrulamak için ana sayfa
app.get('/', (req, res) => {
    res.send('LuLu Müzik API Aktif ve Çalışıyor!');
});

// Sketchware'den gelecek istek endpoint'i
app.get('/stream', async (req, res) => {
    const spotifyUrl = req.query.url;
    
    if (!spotifyUrl) {
        return res.status(400).send('Hata: Spotify URL girilmedi.');
    }

    try {
        // Gelen linkin Spotify şarkısı olup olmadığını kontrol et
        if (spotifyUrl.includes('spotify.com/track/')) {
            // play-dl kütüphanesi Spotify linkindeki şarkı adını ve sanatçıyı çözer
            const trackInfo = await play.spotify(spotifyUrl);
            const searchQuery = `${trackInfo.name} ${trackInfo.artists[0].name}`;
            
            // Çözülen isimle en temiz ses akışını yakalar
            const searchResult = await play.search(searchQuery, { limit: 1 });
            
            if (searchResult.length > 0) {
                const stream = await play.stream(searchResult[0].url);
                
                // Sketchware MediaPlayer'ın veriyi doğrudan müzik olarak okuması için header ayarı
                res.setHeader('Content-Type', 'audio/mpeg');
                
                // Ses akışını (pipe) doğrudan uygulamaya aktar
                stream.stream.pipe(res);
            } else {
                res.status(404).send('Şarkı bulunamadı.');
            }
        } else {
            res.status(400).send('Geçersiz Spotify linki. Sadece tekil şarkı (track) desteklenir.');
        }
    } catch (error) {
        res.status(500).send('Sunucu Hatası: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`LuLu API ${PORT} portunda dinleniyor.`);
});
