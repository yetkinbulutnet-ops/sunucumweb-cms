const { createStrapi, compileStrapi } = require('@strapi/strapi');

const ETIKET = {
  'api::blog-yazisi.blog-yazisi': {
    baslik: ['Başlık', 'Sayfa başlığı (H1). 50-65 karakter idealdir'],
    slug: ['Adres (slug)', 'Sayfa adresi: /blog/<adres>. Yayından sonra değiştirmeyin (SEO)'],
    ozet: ['Özet', 'Listelerde ve arama sonuçlarında görünür (150-300 karakter)'],
    kapak: ['Kapak görseli', 'Önerilen 1600×900 (16:9); otomatik webp yapılır. Alternatif metni doldurun'],
    icerik: ['İçerik', 'Ara başlıklar için ## ve ###, madde için - kullanın. İçindekiler ## ve ### başlıklardan otomatik oluşur'],
    kategori: ['Kategori', ''],
    yazar: ['Yazar', 'Boş bırakılırsa "SunucumWEB Ekibi" gösterilir'],
    etiketler: ['Etiketler', 'Her satıra bir etiket'],
    yayinTarihi: ['Yayın tarihi', 'Boş bırakılırsa ilk yayınlanma zamanı kullanılır'],
    oneCikan: ['Öne çıkan', 'Blog ana sayfasında büyük kart olarak gösterilir'],
    seoBaslik: ['SEO başlığı', 'Boşsa başlık kullanılır (en fazla 70 karakter)'],
    seoAciklama: ['SEO açıklaması', 'Boşsa özet kullanılır (en fazla 170 karakter)'],
    sss: ['Sıkça sorulan sorular', 'Yazının sonunda gösterilir ve Google için FAQ şeması üretir'],
  },
  'api::blog-kategorisi.blog-kategorisi': {
    ad: ['Kategori adı', ''],
    slug: ['Adres (slug)', 'Sayfa adresi: /blog/kategori/<adres>'],
    sira: ['Sıralama', 'Küçük sayı önce gelir'],
    aciklama: ['Açıklama', 'Kategori sayfasının üstünde görünür'],
    seoBaslik: ['SEO başlığı', ''],
    seoAciklama: ['SEO açıklaması', ''],
    yazilar: ['Yazılar', ''],
  },
  'api::blog-yazari.blog-yazari': {
    ad: ['Ad soyad', ''],
    slug: ['Kimlik (slug)', ''],
    unvan: ['Unvan', 'ör. Sistem Yöneticisi'],
    biyografi: ['Kısa biyografi', 'Yazı sonundaki yazar kutusunda görünür'],
    fotograf: ['Fotoğraf', 'Kare, en az 256×256'],
    yazilar: ['Yazılar', ''],
  },
};

const LISTE = {
  'api::blog-yazisi.blog-yazisi': { mainField: 'baslik', list: ['kapak', 'baslik', 'kategori', 'yazar', 'oneCikan'], sort: 'createdAt', yon: 'DESC' },
  'api::blog-kategorisi.blog-kategorisi': { mainField: 'ad', list: ['ad', 'slug', 'sira'], sort: 'sira', yon: 'ASC' },
  'api::blog-yazari.blog-yazari': { mainField: 'ad', list: ['fotograf', 'ad', 'unvan'], sort: 'ad', yon: 'ASC' },
};

const KATEGORILER = [
  ['Web Hosting', 'web-hosting', 'Paylaşımlı hosting, cPanel ve web sitesi yönetimi üzerine rehberler.'],
  ['Sunucu Yönetimi', 'sunucu-yonetimi', 'VDS, dedicated sunucu ve Linux sistem yönetimi yazıları.'],
  ['WordPress', 'wordpress', 'WordPress hız, güvenlik ve bakım rehberleri.'],
  ['Alan Adı', 'alan-adi', 'Alan adı tescili, transfer ve DNS yönetimi.'],
  ['Güvenlik', 'guvenlik', 'Web sitesi ve sunucu güvenliği, SSL ve DDoS koruması.'],
  ['Duyurular', 'duyurular', 'SunucumWEB hizmet, altyapı ve kampanya duyuruları.'],
];

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const K = app.documents('api::blog-kategorisi.blog-kategorisi');
  for (const [i, [ad, slug, aciklama]] of KATEGORILER.entries()) {
    const var_ = await K.findFirst({ filters: { slug }, status: 'draft' });
    if (!var_) await K.create({ data: { ad, slug, aciklama, sira: (i + 1) * 10 }, status: 'published' });
  }
  const Y = app.documents('api::blog-yazari.blog-yazari');
  if (!(await Y.findFirst({ filters: { slug: 'sunucumweb-ekibi' }, status: 'draft' }))) {
    await Y.create({ data: { ad: 'SunucumWEB Ekibi', slug: 'sunucumweb-ekibi', unvan: 'Teknik Ekip', biyografi: 'SunucumWEB altyapı ve destek ekibi; hosting, sunucu ve web teknolojileri üzerine deneyimlerini paylaşıyor.' }, status: 'published' });
  }
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
    const yeni = { ...ayar, metadatas, settings: { ...ayar.settings, mainField: l.mainField, defaultSortBy: l.sort, defaultSortOrder: l.yon, pageSize: 20 }, layouts: { ...ayar.layouts, list: l.list } };
    delete yeni.uid;
    await servis.updateConfiguration(tip, yeni);
  }
  console.log('blog hazir: kategoriler + varsayilan yazar + etiketler');
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
