const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const TIPLER = {
  'api::site-ayari.site-ayari': {
    ad: ['Kayıt adı', ''],
    firmaUnvani: ['Firma ünvanı', 'Alt bilgide ve BTK satırında görünür'],
    adres: ['Adres (görünen)', 'Alt bilgide tek satır olarak görünür'],
    adresSokak: ['Adres: mahalle / sokak', 'Google için yapılandırılmış adres'],
    adresIlce: ['Adres: ilçe', ''],
    adresIl: ['Adres: il', ''],
    postaKodu: ['Posta kodu', ''],
    telefon: ['Telefon (görünen)', 'ör. 0(850) 302 5809'],
    telefonBaglanti: ['Telefon bağlantısı', 'ör. tel:08503025809'],
    eposta: ['E-posta', 'Alt bilgideki destek adresi'],
    kep: ['KEP adresi', ''],
    panelAdresi: ['Müşteri paneli adresi', 'Üst çubuk ve menüdeki “Müşteri Paneli” bağlantısı'],
    durumAdresi: ['Durum sayfası adresi', '“Ağ Durumu” bağlantısı'],
    sosyalMedya: ['Sosyal medya hesapları', ''],
    ustMenu: ['Üst menü', 'Ana menü sekmeleri; alt öğesi olmayan sekme doğrudan bağlantıya gider'],
    aracMenusu: ['Araçlar menüsü', 'Menüdeki “Araçlar” açılır paneli'],
    altMenuler: ['Alt bilgi menüleri', 'Sayfanın en altındaki bağlantı sütunları'],
    btkMetni: ['BTK metni', ''],
    btkBaglanti: ['BTK bağlantısı', ''],
    btkLogo: ['BTK logo adresi', ''],
    etbisMetni: ['ETBİS metni', ''],
    etbisBaglanti: ['ETBİS doğrulama bağlantısı', ''],
    etbisLogo: ['ETBİS logo adresi', ''],
    trustpilotPuan: ['Trustpilot puanı', '5 üzerinden, ör. 3.8'],
    trustpilotYorumSayisi: ['Trustpilot yorum sayısı', ''],
    trustpilotBaglanti: ['Trustpilot bağlantısı', ''],
    googleYorumBaglanti: ['Google yorumları bağlantısı', ''],
    altyapiBasligi: ['Altyapı şeridi başlığı', 'Alt bilgideki teknoloji logoları şeridinin başlığı'],
    ctaBaslik: ['Çağrı bandı başlığı', 'Sayfa sonlarındaki “Bugün başlayın” bandı (sayfaya özel metin yoksa)'],
    ctaMetni: ['Çağrı bandı metni', ''],
  },
  'api::iletisim.iletisim': {
    ad: ['Kayıt adı', ''],
    ust: ['Sayfa üst metni', ''],
    kanallar: ['İletişim kanalları', 'Formun solundaki kartlar'],
    konular: ['Form konuları', 'Konu kodu e-posta yönlendirmesinde kullanılır; mevcut kodları değiştirmeyin'],
    basariMetni: ['Gönderim sonrası mesaj', 'Form gönderilince görünen açıklama'],
  },
  'api::arac.arac': {
    baslik: ['Araç adı', ''],
    slug: ['Araç kodu', 'Aracın çalışan motoruna bağlıdır, DEĞİŞTİRMEYİN (adres: /araclar/<kod>)'],
    kisa: ['Kısa ad', 'Menü ve kısa listelerde görünür'],
    ozet: ['Kısa açıklama', 'Araç kartında görünür'],
    ikon: ['İkon', ''],
    girdiEtiketi: ['Giriş alanı etiketi', 'ör. Alan adı'],
    ornek: ['Örnek değer', 'Giriş alanında örnek olarak görünür'],
    girdiOpsiyonel: ['Giriş isteğe bağlı', 'İşaretliyse boş sorgu yapılabilir'],
    aciklama: ['Açıklama', 'Aracın altındaki bilgilendirme metni'],
    seo: ['SEO açıklaması', 'Google sonuçlarında görünen açıklama'],
    aktif: ['Sitede göster', ''],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
  },
  'api::marka.marka': {
    tur: ['Tür', 'referans: “Bizimle çalışan markalar” şeridi, altyapi: alt bilgideki teknoloji logoları'],
  },
  'api::anasayfa.anasayfa': {
    kategoriler: ['Çözüm kategorileri', '“Size uygun çözümü seçin” bölümündeki kartlar'],
    altyapiMaddeleri: ['Altyapı maddeleri', '“Altyapımız” bölümündeki 4 madde'],
    cozumlerBolumu: ['Çözümler bölümü', ''],
    nedenBolumu: ['Neden SunucumWEB bölümü', ''],
    altyapiBolumu: ['Altyapı bölümü', ''],
    paketlerBolumu: ['Paketler bölümü', ''],
    yazilimBolumu: ['Hazır yazılım bölümü', ''],
    referansBolumu: ['Referanslar bölümü', 'Başlık “Sayfa Metinleri → Marka şeridi”nden gelir'],
    sssBolumu: ['SSS bölümü', ''],
    durumBolumu: ['Sistem durumu bölümü', ''],
    guvenBolumu: ['Koyu güven bandı', 'Rakamların bulunduğu koyu bant'],
  },
  'api::sayfa-metni.sayfa-metni': {
    araclar: ['Araçlar sayfası', ''],
  },
};

const BILESENLER = {
  'ortak.bolum-basligi': { ustBaslik: ['Üst başlık', 'Başlığın üstündeki küçük renkli yazı'], baslik: ['Başlık', ''], aciklama: ['Açıklama', ''] },
  'site.baglanti': { metin: ['Metin', ''], adres: ['Bağlantı', 'ör. /web-hosting'] },
  'site.menu-grubu': { baslik: ['Sütun başlığı', ''], baglantilar: ['Bağlantılar', ''] },
  'site.menu-ogesi': {
    baslik: ['Başlık', ''],
    aciklama: ['Açıklama', ''],
    adres: ['Bağlantı', ''],
    ikon: ['İkon', ''],
    rozet: ['Rozet', 'ör. %20 İndirim (boş bırakılabilir)'],
    rozetTonu: ['Rozet rengi', ''],
    logo: ['Logo yolu', 'ör. /img/urun/xeon.webp veya tam adres'],
    vurgu: ['Vurgulu', 'Öğeyi öne çıkarır'],
  },
  'site.ust-menu': { etiket: ['Sekme adı', ''], adres: ['Bağlantı', 'Alt öğe yoksa bu adrese gider'], kolon: ['Sütun sayısı', 'Açılır paneldeki sütun sayısı (1-4)'], aiRozeti: ['“AI” rozeti', ''], ogeler: ['Alt öğeler', ''] },
  'site.sosyal': { platform: ['Platform', ''], adres: ['Profil adresi', ''] },
  'iletisim.kanal': { ikon: ['İkon', ''], baslik: ['Başlık', ''], deger: ['Değer', 'ör. telefon numarası'], aciklama: ['Açıklama', 'ör. Hafta içi 09:00 – 18:00'], baglanti: ['Bağlantı', 'ör. tel:08503025809 (boşsa tıklanamaz)'] },
  'iletisim.konu': { kod: ['Konu kodu', 'Küçük harf, boşluksuz (ör. satis)'], etiket: ['Görünen ad', ''] },
  'anasayfa.kategori-urunu': { metin: ['Ürün adı', ''], aciklama: ['Kısa açıklama', ''], adres: ['Bağlantı', ''] },
  'anasayfa.kategori': { baslik: ['Kategori adı', ''], ikon: ['İkon', ''], ozet: ['Özet', ''], oneCikan: ['Öne çıkar', 'Koyu kart olarak gösterilir'], urunler: ['Ürünler', ''] },
};

const LISTE = {
  'api::arac.arac': { mainField: 'baslik', list: ['baslik', 'slug', 'aktif', 'sira'], sort: 'sira' },
  'api::marka.marka': { mainField: 'ad', list: ['logo', 'ad', 'tur', 'aktif', 'sira'], sort: 'sira' },
};
const GIZLI = {
  'api::site-ayari.site-ayari': { mainField: 'ad', alanlar: ['ad'] },
  'api::iletisim.iletisim': { mainField: 'ad', alanlar: ['ad'] },
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

const tekil = async (app, uid, data) => {
  const s = app.documents(uid);
  const m = await s.findFirst();
  return m ? s.update({ documentId: m.documentId, data }) : s.create({ data });
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const veri = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const gorselKok = process.argv[3];

  await tekil(app, 'api::site-ayari.site-ayari', veri.site);
  await tekil(app, 'api::iletisim.iletisim', veri.iletisim);

  const A = app.documents('api::arac.arac');
  for (const a of veri.araclar) {
    const m = await A.findFirst({ filters: { slug: a.slug } });
    if (m) await A.update({ documentId: m.documentId, data: a });
    else await A.create({ data: a });
  }

  const M = app.documents('api::marka.marka');
  for (const m of await M.findMany({ limit: 500 })) if (!m.tur) await M.update({ documentId: m.documentId, data: { tur: 'referans' } });
  for (const a of veri.altyapi) {
    const logo = await gorselYukle(app, path.join(gorselKok, a.dosya), `${a.ad} logo.webp`, `${a.ad} logosu`);
    const m = await M.findFirst({ filters: { ad: a.ad, tur: 'altyapi' } });
    const data = { ad: a.ad, logo, tur: 'altyapi', aktif: true, sira: a.sira };
    if (m) await M.update({ documentId: m.documentId, data });
    else await M.create({ data });
  }

  const AS = app.documents('api::anasayfa.anasayfa');
  const as = await AS.findFirst();
  await AS.update({ documentId: as.documentId, data: veri.anasayfa });

  const SM = app.documents('api::sayfa-metni.sayfa-metni');
  const sm = await SM.findFirst();
  await SM.update({ documentId: sm.documentId, data: { araclar: veri.araclarSayfa } });

  await etiketle(app);
  console.log(`faz7 aktarildi: ${veri.araclar.length} arac, ${veri.altyapi.length} altyapi logosu`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
