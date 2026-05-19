const express = require('express');
const play = require('play-dl');
const app = express();
const PORT = process.env.PORT || 3000;

// play-dl kütüphanesini başlat ve Spotify misafir tokenini almayı dene
async function baslat() {
    try {
        await play.getFreeToken();
        console.log("Spotify ücretsiz token başarıyla alındı.");
    } catch (e) {
        console.log("Token alınırken uyarı (Önemli olmayabilir):", e.message);
    }
}
baslat();

app.get('/', (req, res) => {
    res.send('LuLu Müzik API Aktif ve Çalışıyor!');
});

app.get('/stream', async (req, res) => {
    let spotifyUrl = req.query.url;
    
    if (!spotifyUrl) {
        return res.status(400).send('Hata: Spotify URL girilmedi.');
    }

    // Mobil cihazlardan gelen URL'lerdeki gereksiz parametreleri temizle (?si=... gibi)
    if (spotifyUrl.includes('?')) {
        spotifyUrl = spotifyUrl.split('?')[0];
    }

    console.log("Gelen URL işleniyor:", spotifyUrl);

    try {
        if (spotifyUrl.includes('spotify.com/track/')) {
            // Spotify linkinden şarkı bilgilerini çek
            const trackInfo = await play.spotify(spotifyUrl);
            const searchQuery = `${trackInfo.name} ${trackInfo.artists[0].name}`;
            console.log(`Aranan Şarkı: ${searchQuery}`);
            
            // YouTube Music veya YouTube üzerinden en kararlı ses kaynağını ara
            const searchResult = await play.search(searchQuery, { limit: 1, source: { youtube: 'video' } });
            
            if (searchResult && searchResult.length > 0) {
                console.log("Kaynak bulundu:", searchResult[0].url);
                
                // Canlı akışı (stream) başlat
                const stream = await play.stream(searchResult[0].url, { quality: 1 }); // En kararlı kalite
                
                res.setHeader('Content-Type', 'audio/mpeg');
                stream.stream.pipe(res);
            } else {
                console.log("Hata: Arama sonucu boş döndü.");
                res.status(404).send('Not Found: Şarkı ses kaynağı bulunamadı.');
            }
        } else {
            res.status(400).send('Geçersiz Spotify linki.');
        }
    } catch (error) {
        console.error("Sunucu içi hata:", error);
        res.status(500).send('Sunucu Hatası: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`LuLu API ${PORT} portunda dinleniyor.`);
});
