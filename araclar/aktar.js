const fs = require('fs');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const ETIKET = {
  'api::urun.urun': {
    baslik: ['Başlık', 'Menüde ve sayfa başlığında görünen ürün adı'],
    slug: ['Adres (slug)', 'Sayfa adresi: sunucumweb.com/<adres>. Değiştirmek SEO kaybına yol açar.'],
    durum: ['Durum', 'yayinda: normal ürün sayfası · yapim-asamasi: "Çok yakında" sayfası (indexlenmez)'],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    ikon: ['İkon', ''],
    ustBaslik: ['Üst başlık', 'Başlığın üstündeki küçük etiket'],
    altBaslik: ['Açıklama', 'Başlığın altındaki tanıtım metni'],
    seoBaslik: ['SEO başlığı', 'Google sonuçlarında görünen başlık (en fazla 70 karakter)'],
    seoAciklama: ['SEO açıklaması', 'Boş bırakılırsa açıklama kullanılır (en fazla 170 karakter)'],
    heroIstatistikleri: ['Öne çıkan rakamlar', 'Üst bölümdeki büyük rakamlar (en fazla 4)'],
    teknikOzellikler: ['Teknik özellikler', 'Etiket - değer listesi'],
    ozelliklerBasligi: ['Özellikler başlığı', ''],
    ozellikler: ['Özellikler', 'İkonlu özellik kartları'],
    sss: ['Sıkça sorulan sorular', ''],
    siparisKategoriYolu: ['Sipariş kategori yolu', 'my.sunucumweb.com altındaki kategori yolu, ör. /kategori/hosting/web-hosting'],
    planlar: ['Planlar', 'Bu ürüne bağlı fiyat paketleri'],
  },
  'api::plan.plan': {
    ad: ['Plan adı', ''],
    urun: ['Ürün', 'Planın gösterileceği ürün sayfası'],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    altBaslik: ['Alt başlık', 'Plan adının altındaki kısa açıklama'],
    fiyat: ['Aylık fiyat (₺)', 'Ondalık için nokta kullanın, ör. 49.90. Boş bırakılırsa "Teklif Al" gösterilir.'],
    eskiFiyat: ['Eski fiyat (₺)', 'Üstü çizili gösterilir, boş bırakılabilir'],
    indirim: ['İndirim etiketi', 'ör. %20'],
    populer: ['Popüler', 'Öne çıkarılmış plan olarak vurgulanır'],
    detaylar: ['Donanım / detay satırları', 'Sunucu planlarında satır halinde gösterilir'],
    ozellikler: ['Özellikler', 'Her satıra bir özellik yazın'],
    siparisYolu: ['Sipariş yolu', 'my.sunucumweb.com/siparis/ sonrası kısım, ör. hosting/222'],
  },
  'ortak.istatistik': { deger: ['Değer', 'ör. %99.9'], etiket: ['Etiket', 'ör. Uptime'] },
  'ortak.etiket-deger': { etiket: ['Etiket', ''], deger: ['Değer', ''] },
  'ortak.sss': { soru: ['Soru', ''], cevap: ['Cevap', ''] },
  'urun.ozellik': { ikon: ['İkon', ''], baslik: ['Başlık', ''], aciklama: ['Açıklama', ''] },
  'urun.detay': { etiket: ['Etiket', 'ör. İşlemci (boş bırakılabilir)'], deger: ['Değer', 'ör. 2 Core CPU'], donanim: ['Donanım satırı', 'Kapalıysa ek özellik olarak gösterilir'] },
};

const LISTE = {
  'api::urun.urun': { mainField: 'baslik', list: ['baslik', 'slug', 'durum', 'sira'], sort: 'sira' },
  'api::plan.plan': { mainField: 'ad', list: ['ad', 'urun', 'fiyat', 'populer', 'sira'], sort: 'sira' },
};

const etiketle = async (app) => {
  const cm = app.plugin('content-manager');
  for (const [uid, alanlar] of Object.entries(ETIKET)) {
    const bilesen = !uid.startsWith('api::');
    const servis = cm.service(bilesen ? 'components' : 'content-types');
    const tip = bilesen ? app.components[uid] : app.contentTypes[uid];
    const ayar = await servis.findConfiguration(tip);
    const metadatas = { ...ayar.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = {
        ...m,
        edit: { ...(m.edit || {}), label, description, placeholder: m.edit?.placeholder || '' },
        list: { ...(m.list || {}), label },
      };
    }
    const yeni = { ...ayar, metadatas };
    const l = LISTE[uid];
    if (l) {
      yeni.settings = { ...ayar.settings, mainField: l.mainField, defaultSortBy: l.sort, defaultSortOrder: 'ASC', pageSize: 20 };
      yeni.layouts = { ...ayar.layouts, list: l.list };
    }
    delete yeni.uid;
    delete yeni.isComponent;
    delete yeni.category;
    await servis.updateConfiguration(tip, yeni);
  }
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const veri = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const U = app.documents('api::urun.urun');
  const P = app.documents('api::plan.plan');
  let planSayisi = 0;
  for (const kayit of veri) {
    const { planlar, ...alan } = kayit;
    const mevcut = await U.findFirst({ filters: { slug: kayit.slug }, status: 'draft' });
    const urun = mevcut
      ? await U.update({ documentId: mevcut.documentId, data: alan, status: 'published' })
      : await U.create({ data: alan, status: 'published' });
    const eski = await P.findMany({ filters: { urun: { documentId: urun.documentId } }, status: 'draft' });
    for (const e of eski) await P.delete({ documentId: e.documentId });
    for (const p of planlar) {
      await P.create({ data: { ...p, urun: urun.documentId }, status: 'published' });
      planSayisi += 1;
    }
  }
  await etiketle(app);
  console.log(`aktarildi: ${veri.length} urun, ${planSayisi} plan`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
