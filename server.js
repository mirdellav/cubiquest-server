const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let bagliCihazlar = {};
let hazirOlanlar = {};
let aktifKopruBlok = 0;

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        
        if (data.tip === 'baglan') {
            bagliCihazlar[data.cihazId] = ws;
            herkeseYayinla({ tip: 'durumGuncelle', bagliListesi: Object.keys(bagliCihazlar) });
        }
        
        if (data.tip === 'hazir') {
            hazirOlanlar[data.cihazId] = true;
            herkeseYayinla({ tip: 'hazirGuncelle', hazirListesi: Object.keys(hazirOlanlar) });
            if (Object.keys(hazirOlanlar).length === 3) {
                herkeseYayinla({ tip: 'oyunuBaslat' });
                hazirOlanlar = {};
            }
        }

        // Modül 1: Eşzamanlı Boyama Verisi Dağıtımı
        if (data.tip === 'boyama') {
            herkeseYayinla(data);
        }

        if (data.tip === 'modul1Basari') {
            herkeseYayinla({ tip: 'modul1Gec' });
        }

        // Modül 2: Akıl Köprüsü Dağıtımı
        if (data.tip === 'kopruBlok') {
            aktifKopruBlok = data.blokNo;
            herkeseYayinla({ tip: 'aktifBlokGuncelle', blokNo: data.blokNo });
        }

        if (data.tip === 'karakterKopru') {
            if (data.pozisyon === aktifKopruBlok) {
                if (data.pozisyon === 4) {
                    herkeseYayinla({ tip: 'modul2Gec' });
                }
            } else {
                // Karakter yanlış (parlamayan) bloğa basarsa başa döner
                herkeseYayinla({ tip: 'aktifBlokGuncelle', blokNo: 0 });
            }
        }

        // Modül 3: Ödül Adası Ortak İnşa Küp Dağıtımı
        if (data.tip === 'kutuInsa') {
            herkeseYayinla(data);
        }
    });

    ws.on('close', function() {
        for (let id in bagliCihazlar) {
            if (bagliCihazlar[id] === ws) {
                delete bagliCihazlar[id];
                delete hazirOlanlar[id];
                herkeseYayinla({ tip: 'durumGuncelle', bagliListesi: Object.keys(bagliCihazlar) });
                break;
            }
        }
    });
});

functionInput herkeseYayinla(veri) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(veri));
        }
    });
}
console.log("CubiQuest Engine Aktif.");
