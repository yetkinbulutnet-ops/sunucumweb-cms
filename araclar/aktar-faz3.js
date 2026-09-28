const { createStrapi, compileStrapi } = require('@strapi/strapi');

const ETIKET = {
  'api::duyuru.duyuru': {
    metin: ['Duyuru metni', 'En fazla 180 karakter; kısa ve net tutun'],
    baglanti: ['Bağlantı', 'ör. /kampanyalar veya https://...'],
    baglantiMetni: ['Bağlantı metni', 'ör. İncele'],
    ton: ['Renk', 'marka: turkuaz, bilgi: mavi, kampanya: amber, uyari: kırmızı, basari: yeşil'],
    baslangic: ['Başlangıç', 'Boşsa yayınlanınca hemen başlar'],
    bitis: ['Bitiş', 'Boşsa süresiz gösterilir; bu tarihte otomatik kalkar'],
    kapatilabilir: ['Kapatılabilir', 'Ziyaretçi çarpı ile kapatabilir (bir daha görmez)'],
    sira: ['Öncelik', 'Aynı anda birden fazla yayındaysa küçük sayı gösterilir'],
  },
  'api::cark-ayari.cark-ayari': {
    aktif: ['Çark aktif', 'Kapalıyken sitede çark rozeti görünmez'],
    donem: ['Dönem kodu', 'E-posta başına hak dönem başına 1’dir. Yeni kampanyada değiştirin (ör. 2026-2) → herkes yeniden çevirebilir'],
    baslik: ['Pencere başlığı', ''],
    aciklama: ['Pencere açıklaması', ''],
    rozetMetni: ['Rozet metni', 'Köşedeki butonda görünür'],
    ipGunlukLimit: ['IP başına günlük sınır', 'Aynı bağlantıdan 24 saatte en fazla kaç katılım'],
  },
  'api::cark-odulu.cark-odulu': {
    ad: ['Ödül adı', 'ör. %10 Hosting İndirimi (e-postada ve sonuçta görünür)'],
    etiket: ['Çark etiketi', 'Dilimin üstünde yazan kısa metin (en fazla 16 karakter)'],
    aciklama: ['Açıklama', 'Kuponun ne işe yaradığı'],
    renk: ['Dilim rengi', ''],
    agirlik: ['Kazanma ağırlığı', 'Göreceli olasılık: 10 ve 30 olan iki dilimde ikincisi 3 kat sık çıkar. 0 = hiç çıkmaz'],
    kazanamaz: ['Boş dilim', 'İşaretliyse kupon verilmez (ör. "Bir dahaki sefere")'],
    aktif: ['Aktif', 'Kapalı dilim çarkta görünmez'],
    gecerlilik: ['Geçerlilik', 'ör. 31 Aralık 2026’ya kadar'],
    baglanti: ['Kullanım bağlantısı', 'ör. /web-hosting'],
    sira: ['Sıra', 'Çarktaki dizilişi belirler'],
    yeniKuponlar: ['Kupon ekle (toplu)', 'Her satıra bir kupon kodu yapıştırın ve kaydedin; kodlar havuza eklenir, bu alan temizlenir. Kodu biten dilim otomatik devre dışı kalır'],
    kuponlar: ['Kupon havuzu', ''],
  },
  'api::cark-kuponu.cark-kuponu': {
    kod: ['Kupon kodu', ''],
    odul: ['Ödül', ''],
    kullanildi: ['Verildi', ''],
    verilenEposta: ['Verilen e-posta', ''],
    verilmeTarihi: ['Verilme tarihi', ''],
  },
  'api::cark-katilimi.cark-katilimi': {
    eposta: ['E-posta', ''],
    donem: ['Dönem', ''],
    odul: ['Ödül', ''],
    odulAdi: ['Ödül adı', ''],
    kupon: ['Kupon', ''],
    ip: ['IP adresi', ''],
    kvkkOnay: ['Aydınlatma onayı', ''],
    pazarlamaOnay: ['Kampanya e-postası izni', ''],
  },
};

const LISTE = {
  'api::duyuru.duyuru': { mainField: 'metin', list: ['metin', 'ton', 'baslangic', 'bitis'], sort: 'sira', yon: 'ASC' },
  'api::cark-odulu.cark-odulu': { mainField: 'ad', list: ['ad', 'etiket', 'agirlik', 'aktif', 'kazanamaz'], sort: 'sira', yon: 'ASC' },
  'api::cark-kuponu.cark-kuponu': { mainField: 'kod', list: ['kod', 'odul', 'kullanildi', 'verilenEposta', 'verilmeTarihi'], sort: 'id', yon: 'DESC' },
  'api::cark-katilimi.cark-katilimi': { mainField: 'eposta', list: ['eposta', 'odulAdi', 'kupon', 'pazarlamaOnay', 'createdAt'], sort: 'createdAt', yon: 'DESC' },
};

const ORNEK = [
  ['%10 Hosting İndirimi', '%10 İNDİRİM', 'turkuaz', 30, false, '/web-hosting'],
  ['Bir dahaki sefere', 'PAS', 'gri', 25, true, ''],
  ['%20 Hosting İndirimi', '%20 İNDİRİM', 'lacivert', 15, false, '/web-hosting'],
  ['Ücretsiz .com.tr Alan Adı', 'ALAN ADI', 'amber', 5, false, '/alan-adi'],
  ['%15 VDS İndirimi', '%15 VDS', 'mor', 15, false, '/sanal-sunucu'],
  ['1 Ay Bedava Hosting', '1 AY BEDAVA', 'yesil', 10, false, '/web-hosting'],
];

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const ayar = await app.documents('api::cark-ayari.cark-ayari').findFirst();
  if (!ayar) await app.documents('api::cark-ayari.cark-ayari').create({ data: { aktif: false, donem: '2026-1' } });
  const O = app.documents('api::cark-odulu.cark-odulu');
  if ((await O.count()) === 0) {
    for (const [i, [ad, etiket, renk, agirlik, kazanamaz, baglanti]] of ORNEK.entries()) {
      await O.create({ data: { ad, etiket, renk, agirlik, kazanamaz, baglanti, sira: (i + 1) * 10, aktif: true, gecerlilik: kazanamaz ? '' : 'Kampanya süresince' } });
    }
  }
  const cm = app.plugin('content-manager').service('content-types');
  for (const [uid, alanlar] of Object.entries(ETIKET)) {
    const tip = app.contentTypes[uid];
    const ay = await cm.findConfiguration(tip);
    const metadatas = { ...ay.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = { ...m, edit: { ...(m.edit || {}), label, description, placeholder: m.edit?.placeholder || '' }, list: { ...(m.list || {}), label } };
    }
    const yeni = { ...ay, metadatas };
    const l = LISTE[uid];
    if (l) {
      yeni.settings = { ...ay.settings, mainField: l.mainField, defaultSortBy: l.sort, defaultSortOrder: l.yon, pageSize: 20 };
      yeni.layouts = { ...ay.layouts, list: l.list };
    }
    delete yeni.uid;
    await cm.updateConfiguration(tip, yeni);
  }
  console.log('faz3 hazir');
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
