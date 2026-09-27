const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const TIPLER = {
  'api::arayuz-metni.arayuz-metni': {
    metin: ['Metin', 'Sitede görünen yazı. {isim} gibi süslü parantezli kısımlar otomatik doldurulur, silmeyin'],
    grup: ['Bölüm', 'Metnin bulunduğu sayfa veya bölüm'],
    konum: ['Nerede görünür', ''],
    anahtar: ['Anahtar', 'Kodun metni bulduğu teknik kimlik'],
  },
  'api::dns-kayit-tipi.dns-kayit-tipi': {
    ad: ['Ad', 'ör. A kaydı'],
    tip: ['Kayıt tipi kodu', 'Teknik kod, DEĞİŞTİRMEYİN'],
    kisa: ['Kısa açıklama', 'ör. IPv4 adresi'],
    ozet: ['Özet', 'Kartlarda görünen bir cümlelik açıklama'],
    ornek: ['Örnek değer', ''],
    aciklama: ['Açıklama', 'Kayıt tipi sayfasındaki uzun açıklama'],
    ipucu: ['İpucu', ''],
    sira: ['Sıralama', ''],
  },
  'api::urun-sayfasi.urun-sayfasi': {
    ad: ['Kayıt adı', ''],
    guvenSeridi: ['Güven şeridi', 'Ürün sayfası üstündeki 4 kısa madde'],
    performans: ['Performans maddeleri', ''],
    guvenlik: ['Güvenlik maddeleri', ''],
    hostingAdimlari: ['Hosting kurulum adımları', 'Hosting ürünlerindeki “3 adımda” bölümü'],
    karsilastirma: ['Karşılaştırma tablosu', 'Hosting paket karşılaştırma tablosu satır grupları'],
  },
  'api::alan-adi-sayfasi.alan-adi-sayfasi': {
    ad: ['Kayıt adı', ''],
    uzantilar: ['Uzantı fiyatları', 'Alan adı sayfasındaki uzantı listesi ve yıllık fiyatlar (₺)'],
    ozellikler: ['Özellikler', ''],
    tescilAdimlari: ['Tescil adımları', ''],
    transferAdimlari: ['Transfer adımları', ''],
    tescilSss: ['Tescil SSS', ''],
    transferSss: ['Transfer SSS', ''],
  },
};

const BILESENLER = {
  'alanadi.uzanti': { uzanti: ['Uzantı', 'ör. .com'], fiyat: ['Yıllık fiyat (₺)', 'Sadece sayı'] },
  'urun.karsilastirma-grubu': { baslik: ['Grup başlığı', ''], satirlar: ['Satırlar', 'Her satıra bir özellik'] },
};

const LISTE = {
  'api::arayuz-metni.arayuz-metni': { mainField: 'metin', list: ['grup', 'metin', 'konum'], sort: 'grup', boyut: 50 },
  'api::dns-kayit-tipi.dns-kayit-tipi': { mainField: 'ad', list: ['tip', 'ad', 'kisa', 'sira'], sort: 'sira' },
};
const GIZLI = {
  'api::urun-sayfasi.urun-sayfasi': { mainField: 'ad', alanlar: ['ad'] },
  'api::alan-adi-sayfasi.alan-adi-sayfasi': { mainField: 'ad', alanlar: ['ad'] },
  'api::arayuz-metni.arayuz-metni': { mainField: 'metin', alanlar: ['anahtar'] },
};

const etiketle = async (app) => {
  const cm = app.plugin('content-manager');
  const isle = async (servis, tip, alanlar, liste) => {
    const ayar = await servis.findConfiguration(tip);
    const metadatas = { ...ayar.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = { ...m, edit: { ...(m.edit || {}), label, description, placeholder: m.edit?.placeholder || '' }, list: { ...(m.list || {}), label } };
    }
    const yeni = { ...ayar, metadatas };
    const gizli = GIZLI[tip.uid];
    if (gizli) {
      yeni.settings = { ...ayar.settings, mainField: gizli.mainField };
      yeni.layouts = { ...ayar.layouts, edit: ayar.layouts.edit.map((satir) => satir.filter((h) => !gizli.alanlar.includes(h.name))).filter((satir) => satir.length) };
    }
    if (liste) {
      yeni.settings = { ...yeni.settings, mainField: liste.mainField, defaultSortBy: liste.sort, defaultSortOrder: 'ASC', pageSize: liste.boyut || 20 };
      yeni.layouts = { ...yeni.layouts, list: liste.list };
    }
    delete yeni.uid;
    delete yeni.isComponent;
    delete yeni.category;
    await servis.updateConfiguration(tip, yeni);
  };
  for (const [uid, alanlar] of Object.entries(TIPLER)) await isle(cm.service('content-types'), app.contentTypes[uid], alanlar, LISTE[uid]);
  for (const [uid, alanlar] of Object.entries(BILESENLER)) await isle(cm.service('components'), app.components[uid], alanlar);
};

const tekil = async (app, uid, data) => {
  const s = app.documents(uid);
  const m = await s.findFirst();
  return m ? s.update({ documentId: m.documentId, data }) : s.create({ data });
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const yapisal = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const sozlukDizini = process.argv[3];
  const guncelle = process.argv.includes('--guncelle');

  const D = app.documents('api::dns-kayit-tipi.dns-kayit-tipi');
  for (const t of yapisal.dns) {
    const m = await D.findFirst({ filters: { tip: t.tip } });
    if (!m) await D.create({ data: t });
    else if (guncelle) await D.update({ documentId: m.documentId, data: t });
  }
  if (!(await app.documents('api::urun-sayfasi.urun-sayfasi').findFirst()) || guncelle) await tekil(app, 'api::urun-sayfasi.urun-sayfasi', yapisal.urun);
  if (!(await app.documents('api::alan-adi-sayfasi.alan-adi-sayfasi').findFirst()) || guncelle) await tekil(app, 'api::alan-adi-sayfasi.alan-adi-sayfasi', yapisal.alanadi);

  const S = app.documents('api::arayuz-metni.arayuz-metni');
  const mevcut = new Map((await S.findMany({ limit: 100000, fields: ['anahtar', 'metin'] })).map((x) => [x.anahtar, x]));
  let yeni = 0;
  let degisen = 0;
  for (const f of fs.readdirSync(sozlukDizini).filter((x) => x.endsWith('.json')).sort()) {
    for (const e of JSON.parse(fs.readFileSync(path.join(sozlukDizini, f), 'utf8'))) {
      const data = { anahtar: e.anahtar, grup: e.grup, konum: e.konum || null, metin: e.metin };
      const m = mevcut.get(e.anahtar);
      if (!m) {
        await S.create({ data });
        yeni++;
      } else if (guncelle && m.metin !== e.metin) {
        await S.update({ documentId: m.documentId, data });
        degisen++;
      }
    }
  }

  await etiketle(app);
  console.log(`faz8: sozluk yeni=${yeni} guncellenen=${degisen} toplam=${mevcut.size + yeni}, dns=${yapisal.dns.length}`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
