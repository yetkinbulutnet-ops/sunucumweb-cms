const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const TIPLER = {
  'api::marka.marka': {
    ad: ['Marka adı', ''],
    logo: ['Logo', 'Şeffaf arka planlı PNG/WebP önerilir; yüklenen görsel otomatik WebP yapılır'],
    site: ['Web sitesi', 'Logoya tıklanınca yeni sekmede açılır (boş bırakılabilir)'],
    aciklama: ['Kısa açıklama', 'ör. Veri merkezi ve kabin kiralama'],
    aktif: ['Sitede göster', 'Kapalıysa logo şeritte görünmez'],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
  },
  'api::hakkimizda.hakkimizda': {
    seoBaslik: ['SEO başlığı', 'Tarayıcı sekmesi ve Google sonuç başlığı'],
    seoAciklama: ['SEO açıklaması', 'Google sonuçlarında görünen açıklama (en fazla 170 karakter)'],
    baslik: ['Sayfa başlığı', ''],
    giris: ['Giriş metni', 'Başlığın altındaki kısa paragraf'],
    hikaye: ['Hikâye', 'Paragrafları boş bir satırla ayırın'],
    fotograflar: ['Kabin fotoğrafları', 'Kaydırmalı fotoğraf alanı; alternatif metin (alt) medya kütüphanesinden girilir. Dikey (yaklaşık 3:4) görseller önerilir'],
    rakamlar: ['Rakamlar', 'Sayaç kartlarında görünen değer + etiket'],
    ilkelerUstBaslik: ['İlkeler üst başlığı', ''],
    ilkelerBaslik: ['İlkeler başlığı', ''],
    ilkeler: ['Hizmet ilkeleri', ''],
    veriMerkeziUstBaslik: ['Veri merkezi üst başlığı', ''],
    veriMerkeziBaslik: ['Veri merkezi başlığı', ''],
    veriMerkeziMetni: ['Veri merkezi metni', ''],
    veriMerkeziOzellikleri: ['Veri merkezi özellikleri', 'Her satıra bir özellik'],
    kartBaslik: ['Konum kartı başlığı', 'Haritadaki işarete dokununca açılan kart'],
    kartMetni: ['Konum kartı metni', ''],
    videolar: ['Kabin videoları', 'Bunny Stream kütüphane ve video kimliği'],
    ctaBaslik: ['Alt çağrı başlığı', 'Sayfanın sonundaki iletişim bandı'],
    ctaMetni: ['Alt çağrı metni', ''],
  },
  'api::ticari-bilgi.ticari-bilgi': {
    baslik: ['Belge başlığı', 'Legal menüsünde ve sayfa başlığında görünür'],
    kisaAd: ['Kısa ad', 'Menüde görünen kısa ad'],
    ozet: ['Özet', 'Menüde başlığın altında görünen kısa açıklama'],
    seoAciklama: ['SEO açıklaması', 'Google sonuçlarında görünen açıklama (en fazla 170 karakter)'],
    bilgiler: ['Şirket bilgileri', 'Ünvan, vergi, adres vb. satırlar'],
    epostalar: ['E-posta adresleri', ''],
    hizmetler: ['Hizmet kapsamı', 'Her satıra bir hizmet'],
    kayitlar: ['Resmî kayıtlar ve belgeler', 'ETBİS, BTK, vergi levhası vb.'],
  },
  'api::sayfa-metni.sayfa-metni': {
    ad: ['Kayıt adı', ''],
    kampanyalar: ['Kampanyalar sayfası', ''],
    hazirYazilim: ['Hazır yazılımlar sayfası', ''],
    legal: ['Legal sayfası', ''],
    markalar: ['Marka şeridi', 'Ana sayfa ve Hakkımızda’daki “Bizimle çalışan markalar” bölümü'],
  },
};

const BILESENLER = {
  'ortak.sayfa-ust': {
    ustBaslik: ['Üst başlık', 'Başlığın üstündeki küçük renkli yazı'],
    baslik: ['Başlık', ''],
    aciklama: ['Açıklama', ''],
    seoBaslik: ['SEO başlığı', 'Boşsa sayfa başlığı kullanılır'],
    seoAciklama: ['SEO açıklaması', 'Google sonuçlarında görünen açıklama'],
  },
  'ortak.baslik-aciklama': { baslik: ['Başlık', ''], aciklama: ['Açıklama', ''] },
  'hakkimizda.video': { baslik: ['Video başlığı', ''], kutuphane: ['Kütüphane kimliği', 'ör. 734078'], video: ['Video kimliği', 'Bunny Stream video GUID'] },
  'ticari.bilgi': { etiket: ['Etiket', 'ör. Vergi numarası'], deger: ['Değer', ''], baglanti: ['Bağlantı', 'İsteğe bağlı, ör. tel:08503025809'] },
  'ticari.kayit': {
    ad: ['Ad', ''],
    aciklama: ['Açıklama', ''],
    baglanti: ['Bağlantı', 'Tıklanınca açılacak adres; belge yüklerseniz belge açılır'],
    belge: ['Belge (PDF)', 'İsteğe bağlı; yüklenirse bağlantı yerine bu dosya açılır'],
    logoAdresi: ['Logo adresi', 'Boşsa belge ikonu gösterilir'],
    logoGenislik: ['Logo genişliği (px)', ''],
    logoYukseklik: ['Logo yüksekliği (px)', ''],
  },
};

const LISTE = {
  'api::marka.marka': { mainField: 'ad', list: ['logo', 'ad', 'site', 'aktif', 'sira'], sort: 'sira' },
};

const GIZLI = { 'api::sayfa-metni.sayfa-metni': { mainField: 'ad', alanlar: ['ad'] } };

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
  let dosya = kaynak;
  let mime = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }[path.extname(kaynak).toLowerCase()];
  if (kaynak.endsWith('.svg')) {
    dosya = kaynak.replace(/\.svg$/, '.png');
    await sharp(kaynak, { density: 144 }).png().toFile(dosya);
    mime = 'image/png';
  }
  const st = fs.statSync(dosya);
  const [y] = await app.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: ad, alternativeText: alt, caption: alt } },
    files: { filepath: dosya, originalFilename: ad, mimetype: mime, size: st.size },
  });
  return y.id;
};

const tekil = async (app, uid, data) => {
  const s = app.documents(uid);
  const m = await s.findFirst();
  return m ? s.update({ documentId: m.documentId, data }) : s.create({ data });
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const veri = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const gorselKok = process.argv[3];

  const H = veri.hakkimizda;
  const fotograflar = [];
  for (const f of H.fotograflar) {
    const ad = f.alt.replace(/[^\p{L}\p{N} ]+/gu, '').trim() + path.extname(f.dosya);
    fotograflar.push(await gorselYukle(app, path.join(gorselKok, 'galeri', f.dosya), ad, f.alt));
  }
  await tekil(app, 'api::hakkimizda.hakkimizda', { ...H, fotograflar });

  const M = app.documents('api::marka.marka');
  for (const m of veri.markalar) {
    const logo = await gorselYukle(app, path.join(gorselKok, 'referans', m.dosya), `${m.ad} logo${m.dosya.endsWith('.svg') ? '.png' : path.extname(m.dosya)}`, `${m.ad} logosu`);
    const { dosya, ...alan } = m;
    const mevcut = await M.findFirst({ filters: { ad: m.ad } });
    const data = { ...alan, logo, aktif: true };
    if (mevcut) await M.update({ documentId: mevcut.documentId, data });
    else await M.create({ data });
  }

  await tekil(app, 'api::ticari-bilgi.ticari-bilgi', veri.ticari);
  await tekil(app, 'api::sayfa-metni.sayfa-metni', { ad: 'Sayfa Metinleri', ...veri.sayfa });

  await etiketle(app);
  console.log(`faz5 aktarildi: ${fotograflar.length} fotograf, ${veri.markalar.length} marka`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
