const { createStrapi, compileStrapi } = require('@strapi/strapi');

const ETIKET = {
  'api::otomatik-blog.otomatik-blog': {
    ad: ['Kayıt adı', ''],
    aktif: ['Otomatik yazı üretimi açık', 'Açıkken sistem aşağıdaki aralıkla konu havuzundan sıradaki konuyu yazar'],
    otoYayin: ['Otomatik yayınla', 'Açıksa kalite kontrolünden geçen yazı doğrudan yayınlanır. Kapalıysa taslak olarak bekler, siz yayınlarsınız'],
    periyotGun: ['Kaç günde bir', 'ör. 2 = iki günde bir yazı'],
    saat: ['Saat (0-23)', 'Yazının hazırlanacağı saat, Türkiye saatiyle. Bu saatten sonraki ilk kontrolde yazılır'],
    bildirim: ['E-posta bildirimi', 'Yazı hazır olunca, konu önerisi gelince ya da sorun çıkınca tüm yöneticilere e-posta gönderilir'],
    yazar: ['Yazar', 'Otomatik yazılarda görünecek yazar'],
    model: ['Model', 'DeepSeek model adı. deepseek-v4-pro daha kaliteli, deepseek-flash daha hızlı ve ucuz'],
    kelimeMin: ['En az kelime', ''],
    kelimeMax: ['En fazla kelime', ''],
    oneriEsigi: ['Konu önerisi eşiği', 'Sıradaki konu sayısı bunun altına düşünce yapay zekâ yeni konu önerir (0 = önermez)'],
    oneriAdedi: ['Öneri sayısı', 'Her seferde önerilecek konu sayısı'],
    sistemTalimati: ['Rol ve yazım kuralları', 'Her istekte en başta gönderilir. Üslup ve içerik kuralları buradadır'],
    planSablonu: ['Plan talimatı', '{konu} {anahtar_kelime} {kategori} {notlar} {kategoriler} {mevcut_yazilar} {sayfalar} {kelime_min} {kelime_max} {sema} otomatik doldurulur. {sema} silinmemelidir'],
    yaziSablonu: ['Yazı talimatı', '{plan} {sayfalar} {kelime_min} {kelime_max} otomatik doldurulur. {plan} silinmemelidir'],
    duzeltmeSablonu: ['Düzeltme talimatı', 'Kalite kontrolünde sorun çıkarsa kullanılır. {sorunlar} ve {metin} silinmemelidir'],
    oneriSablonu: ['Konu önerisi talimatı', '{adet} {kategoriler} {mevcut_yazilar} {havuz} {sema} otomatik doldurulur. {sema} silinmemelidir'],
    yasakliIfadeler: ['Yasaklı ifadeler', 'Her satıra bir ifade. Yazıda geçerse sistem düzelttirir, düzelmezse yazı otomatik yayınlanmaz'],
  },
  'api::blog-konu.blog-konu': {
    konu: ['Konu', 'Yazının konusu, ör. "cPanel ile e-posta hesabı nasıl kurulur"'],
    anahtarKelime: ['Hedef anahtar kelime', 'Google\'da aranmasını istediğiniz ifade'],
    kategori: ['Kategori', 'Boş bırakılırsa yapay zekâ seçer'],
    notlar: ['Yazara not', 'Özellikle anlatılmasını istediğiniz noktalar'],
    durum: ['Durum', 'sirada: yazılmayı bekliyor, onay-bekliyor: yapay zekâ önerisi, sizin onayınızı bekliyor (sirada yaparsanız yazılır)'],
    kaynak: ['Kaynak', ''],
    oncelik: ['Öncelik', 'Büyük sayı önce yazılır (0-100)'],
    yazi: ['Yazılan yazı', ''],
    sonuc: ['Son işlem', 'Sistem doldurur'],
  },
  'api::otomatik-blog-kaydi.otomatik-blog-kaydi': {
    baslik: ['Başlık', ''],
    tur: ['Tür', ''],
    sonuc: ['Sonuç', ''],
    ayrinti: ['Ayrıntı', ''],
    yazi: ['Yazı', ''],
    girdiToken: ['Girdi token', ''],
    ciktiToken: ['Çıktı token', ''],
    sureSn: ['Süre (sn)', ''],
  },
};

const LISTE = {
  'api::blog-konu.blog-konu': { mainField: 'konu', list: ['konu', 'kategori', 'durum', 'oncelik', 'kaynak'], sort: 'createdAt', yon: 'DESC' },
  'api::otomatik-blog-kaydi.otomatik-blog-kaydi': { mainField: 'baslik', list: ['createdAt', 'baslik', 'tur', 'sonuc'], sort: 'createdAt', yon: 'DESC' },
};

const KONULAR = [
  ['Ücretsiz SSL sertifikası yeterli mi? Let\'s Encrypt ile ücretli SSL arasındaki fark', 'ücretsiz ssl sertifikası', 'guvenlik', 'DV, OV, EV farkını sade anlat; cPanel\'de AutoSSL ile kurulumu ve yenileme sorunlarını ekle.'],
  ['cPanel\'de e-posta hesabı açma ve telefona, Outlook\'a kurma', 'cpanel e-posta kurulumu', 'web-hosting', 'IMAP ve POP3 farkı, gelen ve giden sunucu ayarları, sık karşılaşılan şifre ve port hataları.'],
  ['DNS yayılma süresi: alan adı yönlendirmesi neden hemen çalışmıyor?', 'dns yayılma süresi', 'alan-adi', 'TTL mantığı, nameserver değişikliği ile kayıt değişikliği farkı, yerel DNS önbelleğini temizleme komutları.'],
  ['WordPress sitem hacklendi mi? Belirtiler ve temizleme adımları', 'wordpress hacklendi', 'wordpress', 'Belirtiler, önce yedek al, dosya ve veritabanı taraması, şifre değişimi, tekrar olmaması için alınacak önlemler.'],
  ['Yeni VDS sunucuda ilk yapılması gereken güvenlik ayarları', 'vds sunucu güvenliği', 'sunucu-yonetimi', 'SSH anahtarı, root girişini kapatma, port değiştirme, güvenlik duvarı, fail2ban, otomatik güncelleme. Komutlar Ubuntu ve AlmaLinux için.'],
  ['500 Internal Server Error nedenleri ve çözümü', '500 internal server error', 'web-hosting', '.htaccess hataları, PHP sürümü, dosya izinleri, hata günlüğüne cPanel\'den bakma.'],
  ['.com mu .com.tr mi? İşletmeniz için alan adı uzantısı seçimi', 'com.tr alan adı', 'alan-adi', '.com.tr başvurusunda istenen belgeler ve süreç, iki uzantıyı birlikte almanın faydası, marka koruma.'],
  ['WordPress "Allowed memory size exhausted" hatası nasıl çözülür?', 'allowed memory size exhausted', 'wordpress', 'memory_limit nedir, wp-config.php ve cPanel PHP ayarlarından artırma, sorunlu eklentiyi bulma.'],
  ['Linux sunucuda disk doldu: güvenli yer açma rehberi', 'linux disk doldu', 'sunucu-yonetimi', 'du ve df komutları, log dosyaları, eski yedekler, paket önbelleği, journald sınırı. Silmeden önce dikkat edilecekler.'],
  ['Hosting firması değiştirirken siteyi kesintisiz taşıma', 'hosting taşıma', 'web-hosting', 'Yedek alma, yeni sunucuda test için hosts dosyası, DNS geçişi zamanlaması, e-postaların kaybolmaması.'],
];

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const servis = app.plugin('content-manager').service('content-types');
  for (const [uid, alanlar] of Object.entries(ETIKET)) {
    const tip = app.contentTypes[uid];
    const ayar = await servis.findConfiguration(tip);
    const metadatas = { ...ayar.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = { ...m, edit: { ...(m.edit || {}), label, description, placeholder: '' }, list: { ...(m.list || {}), label } };
    }
    let yeni = { ...ayar, metadatas };
    const l = LISTE[uid];
    if (l) yeni = { ...yeni, settings: { ...ayar.settings, mainField: l.mainField, defaultSortBy: l.sort, defaultSortOrder: l.yon, pageSize: 20 }, layouts: { ...ayar.layouts, list: l.list } };
    else yeni = { ...yeni, settings: { ...ayar.settings, mainField: 'ad' }, layouts: { ...ayar.layouts, edit: ayar.layouts.edit.map((s) => s.filter((h) => h.name !== 'ad')).filter((s) => s.length) } };
    delete yeni.uid;
    await servis.updateConfiguration(tip, yeni);
  }

  const K = app.documents('api::blog-konu.blog-konu');
  const KAT = app.documents('api::blog-kategorisi.blog-kategorisi');
  let eklenen = 0;
  if (!(await K.count())) {
    for (const [konu, anahtarKelime, kat, notlar] of KONULAR) {
      const c = await KAT.findFirst({ filters: { slug: kat }, status: 'published' });
      await K.create({ data: { konu, anahtarKelime, notlar, kategori: c?.documentId || null, durum: 'onay-bekliyor', kaynak: 'ekip' } });
      eklenen += 1;
    }
  }
  const a = await require('../src/yardimci/otoblog').ayarGetir();
  console.log('otoblog: etiketler hazir, eklenen konu', eklenen, 'ayar aktif', a.aktif, 'yazar', a.yazar?.ad);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
