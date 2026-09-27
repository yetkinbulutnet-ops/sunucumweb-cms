const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const ETIKET = {
  'api::kampanya.kampanya': {
    baslik: ['Başlık', ''],
    slug: ['Kimlik (slug)', 'Benzersiz kısa ad'],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    kategori: ['Kategori etiketi', 'ör. Web Hosting'],
    ikon: ['İkon', ''],
    aciklama: ['Açıklama', ''],
    indirim: ['İndirim oranı (%)', 'Sadece sayı, ör. 40'],
    eskiFiyat: ['Eski fiyat (₺)', ''],
    yeniFiyat: ['Kampanyalı fiyat (₺)', ''],
    periyot: ['Fiyat periyodu', 'ör. /yıl veya /ay'],
    kupon: ['Kupon kodu', 'Boş bırakılırsa kupon kutusu gösterilmez'],
    bitisTarihi: ['Bitiş tarihi', 'Bu tarihten sonra kampanya sitede otomatik gizlenir'],
    rozet: ['Rozet metni', 'ör. En Popüler, Yeni'],
    rozetTonu: ['Rozet rengi', ''],
    vurgu: ['Öne çıkar', 'Kart vurgulu çerçeveyle gösterilir'],
    baglanti: ['Buton bağlantısı', 'ör. /web-hosting'],
    butonMetni: ['Buton metni', ''],
  },
  'api::yazilim-kategorisi.yazilim-kategorisi': {
    ad: ['Kategori adı', ''],
    slug: ['Kimlik (slug)', ''],
    ikon: ['İkon', ''],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    yazilimlar: ['Yazılımlar', ''],
  },
  'api::hazir-yazilim.hazir-yazilim': {
    ad: ['Yazılım adı', ''],
    slug: ['Adres (slug)', 'Sayfa adresi: /hazir-yazilim/<adres>. Değiştirmek SEO kaybına yol açar.'],
    kategori: ['Kategori', ''],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    fiyat: ['Fiyat (₺)', ''],
    eskiFiyat: ['Eski fiyat (₺)', 'Üstü çizili gösterilir'],
    gorsel: ['Ekran görüntüsü', 'Önerilen 1200×900 veya daha büyük; otomatik webp yapılır'],
    demoUrl: ['Demo adresi', ''],
    oneCikan: ['Öne çıkan', 'Ana sayfa vitrininde gösterilir'],
    acikKaynak: ['Açık kaynak', ''],
    aciklama: ['Açıklama', ''],
    etiketler: ['Etiketler', 'Her satıra bir etiket'],
  },
  'api::yasal-belge.yasal-belge': {
    baslik: ['Başlık', ''],
    slug: ['Adres (slug)', 'Sayfa adresi: /legal/<adres>'],
    kisaAd: ['Kısa ad', 'Menüde görünen kısa ad'],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    ozet: ['Özet', 'Menüde başlığın altında görünen kısa açıklama'],
    ikon: ['İkon', ''],
    seoAciklama: ['SEO açıklaması', 'Google sonuçlarında görünen açıklama (en fazla 170 karakter)'],
    icerik: ['Metin', 'Başlıklar için ## ve ###, madde için - kullanın'],
  },
};

const LISTE = {
  'api::kampanya.kampanya': { mainField: 'baslik', list: ['baslik', 'kategori', 'bitisTarihi', 'sira'], sort: 'sira' },
  'api::yazilim-kategorisi.yazilim-kategorisi': { mainField: 'ad', list: ['ad', 'slug', 'sira'], sort: 'sira' },
  'api::hazir-yazilim.hazir-yazilim': { mainField: 'ad', list: ['gorsel', 'ad', 'kategori', 'fiyat', 'oneCikan'], sort: 'sira' },
  'api::yasal-belge.yasal-belge': { mainField: 'baslik', list: ['baslik', 'slug', 'sira'], sort: 'sira' },
};

const etiketle = async (app) => {
  const servis = app.plugin('content-manager').service('content-types');
  for (const [uid, alanlar] of Object.entries(ETIKET)) {
    const tip = app.contentTypes[uid];
    const ayar = await servis.findConfiguration(tip);
    const metadatas = { ...ayar.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = { ...m, edit: { ...(m.edit || {}), label, description, placeholder: m.edit?.placeholder || '' }, list: { ...(m.list || {}), label } };
    }
    const l = LISTE[uid];
    const yeni = {
      ...ayar,
      metadatas,
      settings: { ...ayar.settings, mainField: l.mainField, defaultSortBy: l.sort, defaultSortOrder: 'ASC', pageSize: 20 },
      layouts: { ...ayar.layouts, list: l.list },
    };
    delete yeni.uid;
    await servis.updateConfiguration(tip, yeni);
  }
};

const kaydet = async (servis, filtre, data) => {
  const mevcut = await servis.findFirst({ filters: filtre, status: 'draft' });
  return mevcut
    ? servis.update({ documentId: mevcut.documentId, data, status: 'published' })
    : servis.create({ data, status: 'published' });
};

const gorselYukle = async (app, dosya, alt) => {
  const ad = path.basename(dosya);
  const var_ = await app.db.query('plugin::upload.file').findOne({ where: { name: ad } });
  if (var_) return var_.id;
  const st = fs.statSync(dosya);
  const [yuklenen] = await app.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: ad, alternativeText: alt, caption: alt } },
    files: { filepath: dosya, originalFilename: ad, mimetype: 'image/webp', size: st.size },
  });
  return yuklenen.id;
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const veri = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const gorselKok = process.argv[3];

  for (const k of veri.kampanyalar) await kaydet(app.documents('api::kampanya.kampanya'), { slug: k.slug }, k);

  const katId = {};
  for (const k of veri.kategoriler) {
    const d = await kaydet(app.documents('api::yazilim-kategorisi.yazilim-kategorisi'), { slug: k.slug }, k);
    katId[k.slug] = d.documentId;
  }

  for (const y of veri.yazilimlar) {
    const { gorselDosya, kategori, ...alan } = y;
    const gorsel = await gorselYukle(app, path.join(gorselKok, path.basename(gorselDosya)), y.ad);
    await kaydet(app.documents('api::hazir-yazilim.hazir-yazilim'), { slug: y.slug }, { ...alan, kategori: katId[kategori], gorsel });
  }

  for (const b of veri.yasal) await kaydet(app.documents('api::yasal-belge.yasal-belge'), { slug: b.slug }, b);

  await etiketle(app);
  console.log(`aktarildi: ${veri.kampanyalar.length} kampanya, ${veri.kategoriler.length} kategori, ${veri.yazilimlar.length} yazilim, ${veri.yasal.length} yasal belge`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
