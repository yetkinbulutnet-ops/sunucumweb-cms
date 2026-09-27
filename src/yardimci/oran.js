'use strict';

const AYAR = 'api::cark-ayari.cark-ayari';
const ODUL = 'api::cark-odulu.cark-odulu';
const KUPON = 'api::cark-kuponu.cark-kuponu';

const yuzde = (x) => `%${(Math.round(x * 10) / 10).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

const hesapla = async () => {
  const oduller = await strapi.db.query(ODUL).findMany({ select: ['id', 'ad', 'agirlik', 'aktif', 'kazanamaz', 'sira'], orderBy: [{ sira: 'asc' }, { id: 'asc' }], limit: 200 });
  const kalanlar = new Map();
  for (const o of oduller) {
    if (o.kazanamaz) continue;
    kalanlar.set(o.id, await strapi.db.query(KUPON).count({ where: { odul: { id: o.id }, kullanildi: false } }));
  }
  const aktifler = oduller.filter((o) => o.aktif && o.agirlik > 0);
  const toplam = aktifler.reduce((t, o) => t + o.agirlik, 0);
  const cekilise = aktifler.filter((o) => o.kazanamaz || kalanlar.get(o.id) > 0);
  const etkinToplam = cekilise.reduce((t, o) => t + o.agirlik, 0);

  const satirlar = [];
  let kuponSansi = 0;
  for (const o of oduller) {
    const etkin = etkinToplam && cekilise.includes(o) ? (o.agirlik / etkinToplam) * 100 : 0;
    if (!o.kazanamaz) kuponSansi += etkin;
    let metin;
    if (!o.aktif) metin = 'Pasif — çarkta görünmez';
    else if (!(o.agirlik > 0)) metin = 'Şans puanı 0 — hiç çıkmaz';
    else {
      const ayarlanan = toplam ? (o.agirlik / toplam) * 100 : 0;
      const kupon = o.kazanamaz ? 'boş dilim' : kalanlar.get(o.id) > 0 ? `${kalanlar.get(o.id)} kupon kaldı` : 'kupon bitti, çıkmaz';
      metin = `Ayarlanan ${yuzde(ayarlanan)} · Şu an ${yuzde(etkin)} · ${kupon}`;
      satirlar.push(`• ${o.ad} (sıra ${o.sira ?? 0}, puan ${o.agirlik}): ${metin}`);
    }
    await strapi.db.query(ODUL).update({ where: { id: o.id }, data: { olasilik: metin.slice(0, 200) } });
  }

  const ozet = aktifler.length
    ? [
        `Toplam şans puanı: ${toplam} (${aktifler.length} aktif dilim). Bir dilimin oranı = kendi puanı ÷ toplam puan.`,
        '',
        ...satirlar,
        '',
        etkinToplam ? `Şu an bir çevirmede kupon çıkma ihtimali ${yuzde(kuponSansi)}, boş dilim ihtimali ${yuzde(100 - kuponSansi)}.` : 'Şu an çekilişe girebilecek dilim yok: çevirenler "ödül kalmadı" uyarısı alır.',
        'Kuponu biten dilim çarkta görünmeye devam eder ama çekilişe girmez; payı diğer dilimlere oranlı dağılır.',
      ].join('\n')
    : 'Aktif dilim yok.';

  const ayar = await strapi.db.query(AYAR).findOne({ select: ['id'] });
  if (ayar) await strapi.db.query(AYAR).update({ where: { id: ayar.id }, data: { sansOzeti: ozet } });
};

let zamanlayici = null;
const oranlariGuncelle = () => {
  clearTimeout(zamanlayici);
  zamanlayici = setTimeout(() => hesapla().catch((e) => strapi.log.warn(`cark oran: ${e.message}`)), 800);
};

module.exports = { oranlariGuncelle, hesapla };
