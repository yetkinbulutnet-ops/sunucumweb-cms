const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const TIPLER = {
  'api::anasayfa-slayti.anasayfa-slayti': {
    vurgu: ['Vurgulu başlık', 'Başlığın turkuaz renkli kısmı (ör. hızlı NVMe hosting)'],
    gorsel: ['Görsel', '4:3 oranlı, en az 1280×960 önerilir; otomatik WebP ve mobil boyutları üretilir. Alternatif metni medya kütüphanesinden girin'],
    ustBaslik: ['Üst etiket', 'Başlığın üstündeki küçük hap (ör. NVMe hosting · cPanel)'],
    onMetin: ['Başlık öncesi', 'Vurgulu kısımdan önceki metin (ör. Siteniz için)'],
    sonMetin: ['Başlık sonrası', 'Vurgulu kısımdan sonraki metin (genelde boş)'],
    aciklama: ['Açıklama', ''],
    buton1Metni: ['Ana buton metni', ''],
    buton1Baglanti: ['Ana buton bağlantısı', 'ör. /web-hosting'],
    buton2Metni: ['İkinci buton metni', 'Boşsa ikinci buton gösterilmez'],
    buton2Baglanti: ['İkinci buton bağlantısı', ''],
    rozetMetni: ['Alt rozet metni', 'Butonların altındaki ikonlu kısa metin'],
    rozetIkon: ['Alt rozet ikonu', ''],
    istatistikDeger: ['Görsel kartı değeri', 'Görselin köşesindeki büyük değer (ör. %99.9)'],
    istatistikEtiket: ['Görsel kartı etiketi', 'ör. Uptime'],
    aktif: ['Sitede göster', 'Kapalıysa slayt gösterilmez'],
    sira: ['Sıralama', 'Küçük sayı önce gelir; ilk slayt sayfa açılışında görünür'],
  },
  'api::anasayfa.anasayfa': {
    ad: ['Kayıt adı', ''],
    rakamlar: ['Rakamlar', 'Koyu banttaki 4 değer'],
    ozellikler: ['Özellik kartları', '“Neden SunucumWEB” bölümündeki kartlar'],
    paketler: ['Öne çıkan paketler', 'Ana sayfadaki paket kartları'],
    sss: ['Sıkça sorulan sorular', 'Google’da SSS olarak da işaretlenir'],
  },
};

const BILESENLER = {
  'anasayfa.paket-ozeti': {
    urun: ['Ürün', 'ör. Web Hosting'],
    paket: ['Paket adı', 'ör. Profesyonel'],
    fiyat: ['Aylık fiyat (₺)', 'Sadece sayı, ör. 99'],
    ozet: ['Kısa açıklama', ''],
    ozellikler: ['Özellikler', 'Her satıra bir özellik'],
    ikon: ['İkon', ''],
    vurgu: ['Öne çıkar', 'İşaretliyse koyu kart + “EN POPÜLER” etiketi'],
  },
};

const LISTE = {
  'api::anasayfa-slayti.anasayfa-slayti': { mainField: 'vurgu', list: ['gorsel', 'vurgu', 'buton1Baglanti', 'aktif', 'sira'], sort: 'sira' },
};
const GIZLI = { 'api::anasayfa.anasayfa': { mainField: 'ad', alanlar: ['ad'] } };

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
      yeni.settings = { ...ayar.settings, mainField: liste.mainField, defaultSortBy: liste.sort, defaultSortOrder: 'ASC', pageSize: 20 };
      yeni.layouts = { ...ayar.layouts, list: liste.list };
    }
    delete yeni.uid;
    delete yeni.isComponent;
    delete yeni.category;
    await servis.updateConfiguration(tip, yeni);
  };
  for (const [uid, alanlar] of Object.entries(TIPLER)) await isle(cm.service('content-types'), app.contentTypes[uid], alanlar, LISTE[uid]);
  for (const [uid, alanlar] of Object.entries(BILESENLER)) await isle(cm.service('components'), app.components[uid], alanlar);
};

const gorselYukle = async (app, kaynak, ad, alt) => {
  const var_ = await app.db.query('plugin::upload.file').findOne({ where: { name: ad } });
  if (var_) return var_.id;
  const st = fs.statSync(kaynak);
  const [y] = await app.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: ad, alternativeText: alt, caption: alt } },
    files: { filepath: kaynak, originalFilename: ad, mimetype: 'image/webp', size: st.size },
  });
  return y.id;
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const veri = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const gorselKok = process.argv[3];

  const S = app.documents('api::anasayfa-slayti.anasayfa-slayti');
  for (const sl of veri.slaytlar) {
    const { dosya, alt, ...alan } = sl;
    const gorsel = await gorselYukle(app, path.join(gorselKok, dosya), `${alt}.webp`, alt);
    const mevcut = await S.findFirst({ filters: { vurgu: sl.vurgu } });
    const data = { ...alan, gorsel, aktif: true };
    if (mevcut) await S.update({ documentId: mevcut.documentId, data });
    else await S.create({ data });
  }

  const A = app.documents('api::anasayfa.anasayfa');
  const m = await A.findFirst();
  const data = { ad: 'Ana Sayfa', ...veri.anasayfa };
  if (m) await A.update({ documentId: m.documentId, data });
  else await A.create({ data });

  await etiketle(app);
  console.log(`faz6 aktarildi: ${veri.slaytlar.length} slayt`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
