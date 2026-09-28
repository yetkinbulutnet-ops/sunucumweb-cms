const { createStrapi, compileStrapi } = require('@strapi/strapi');

const ETIKET = {
  'api::abone.abone': {
    eposta: ['E-posta', ''],
    durum: ['Durum', 'aktif: e-posta alır, beklemede: onay e-postasındaki bağlantıya henüz tıklamadı, e-posta GÖNDERİLMEZ, iptal: abonelikten çıktı, e-posta GÖNDERİLMEZ'],
    kaynak: ['İlk geldiği yer', 'Aboneliğin ilk alındığı form (footer = sayfa altı, cark = çark kampanya izni, panel = elle eklendi)'],
    sonKaynak: ['Son geldiği yer', 'En son hangi formdan abone olmaya çalıştı'],
    izinMetni: ['İzin metni (kanıt)', 'Ziyaretçinin onay kutusunda gördüğü ve işaretlediği metnin birebir kopyası (KVKK / İYS kanıtı)'],
    izinTarihi: ['İzin tarihi', 'Onay kutusunun işaretlenip formun gönderildiği an'],
    izinIp: ['İzin IP adresi', ''],
    tarayici: ['Tarayıcı bilgisi', 'Formu gönderen cihazın tarayıcı kimliği'],
    onayYontemi: ['Onay yöntemi', 'cift-onay: e-postadaki bağlantıyla doğruladı, tek-adim: form veya çark ile doğrudan, panel: elle eklendi'],
    onayTarihi: ['Onay tarihi', ''],
    onayIp: ['Onay IP adresi', ''],
    iptalTarihi: ['Ayrılma tarihi', ''],
    iptalYontemi: ['Ayrılma yöntemi', 'baglanti: abonelikten çık sayfası, tek-tik: e-posta programının abonelikten çık düğmesi, panel: elle'],
    onayGonderimi: ['Gönderilen onay e-postası', 'Bu adrese gönderilen onay e-postası sayısı (10 dakikada en fazla 1, günde en fazla 5)'],
    sonOnayGonderimi: ['Son onay e-postası', ''],
    notlar: ['Not', 'Sadece panelde görünür'],
  },
  'api::bulten-ayari.bulten-ayari': {
    aktif: ['Abonelik formları açık', 'Kapalıyken sitedeki tüm bülten formları gizlenir (çarkın kampanya izni yine havuza eklenir)'],
    ciftOnay: ['Çift onay (önerilen)', 'Açıkken abone olan kişiye onay e-postası gider; bağlantıya tıklayana kadar beklemede kalır. Başkasının adresini yazanları engeller, KVKK/İYS için güçlü kanıttır'],
    footerda: ['Sayfa altında göster', 'Her sayfanın alt bilgisinin üstündeki şerit'],
    anasayfada: ['Ana sayfada göster', 'Ana sayfada SSS bölümünün altında'],
    kampanyalarda: ['Kampanyalar sayfasında göster', ''],
    blogda: ['Blogda göster', 'Blog listesi ve yazı sayfalarının altında'],
    ozet: ['Abone özeti', 'Otomatik hesaplanır. Aboneleri görmek için sol menüden Bülten Abonesi bölümünü açın'],
  },
  'api::cark-ayari.cark-ayari': {
    donem: ['Dönem kodu', 'Hak sayısı dönem başına sayılır. Yeni kampanyada değiştirin (ör. 2026-2) → herkes yeniden çevirebilir'],
    pasTekrarHakki: ['PAS sonrası ek hak', 'Boş dilim (PAS) gelen kişi aynı dönemde en fazla bu kadar kez daha çevirebilir. 0 = tekrar yok. Ödül kazanan tekrar çeviremez. Her çevirme IP günlük sınırından düşer'],
    sansOzeti: ['Şans özeti', 'Otomatik hesaplanır. Dilimlerin şans puanını Çark Ödülü kayıtlarından değiştirin'],
  },
  'api::cark-odulu.cark-odulu': {
    agirlik: ['Şans puanı', 'Oran = bu dilimin puanı ÷ tüm aktif dilimlerin puan toplamı. Ör. puanlar 15+15+15+15+20+20 = 100 ise 15 puanlı dilim %15 çıkar. 0 = hiç çıkmaz. Kaydedince yüzde, Kazanma oranı alanında ve Çark Ayarları → Şans özeti bölümünde görünür'],
    olasilik: ['Kazanma oranı', 'Otomatik hesaplanır. Ayarlanan = puana göre oran, Şu an = kuponu biten dilimler çıkarıldıktan sonraki gerçek oran'],
  },
};

const LISTE = {
  'api::abone.abone': { mainField: 'eposta', list: ['eposta', 'durum', 'kaynak', 'izinTarihi', 'onayTarihi'], sort: 'createdAt', yon: 'DESC' },
  'api::cark-odulu.cark-odulu': { mainField: 'ad', list: ['ad', 'etiket', 'agirlik', 'olasilik', 'aktif'], sort: 'sira', yon: 'ASC' },
};
const GIZLI = { 'api::abone.abone': ['token'] };
const SALT_OKUNUR = {
  'api::bulten-ayari.bulten-ayari': ['ozet'],
  'api::cark-ayari.cark-ayari': ['sansOzeti'],
  'api::cark-odulu.cark-odulu': ['olasilik'],
  'api::abone.abone': ['onayGonderimi', 'sonOnayGonderimi'],
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const cm = app.plugin('content-manager').service('content-types');
  for (const [uid, alanlar] of Object.entries(ETIKET)) {
    const tip = app.contentTypes[uid];
    const ay = await cm.findConfiguration(tip);
    const metadatas = { ...ay.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = { ...m, edit: { ...(m.edit || {}), label, description, placeholder: m.edit?.placeholder || '' }, list: { ...(m.list || {}), label } };
    }
    for (const alan of SALT_OKUNUR[uid] || []) metadatas[alan] = { ...metadatas[alan], edit: { ...metadatas[alan].edit, editable: false } };
    const yeni = { ...ay, metadatas };
    const l = LISTE[uid];
    if (l) {
      yeni.settings = { ...ay.settings, mainField: l.mainField, defaultSortBy: l.sort, defaultSortOrder: l.yon, pageSize: 20 };
      yeni.layouts = { ...ay.layouts, list: l.list };
    }
    const gizli = GIZLI[uid];
    if (gizli) yeni.layouts = { ...yeni.layouts, edit: yeni.layouts.edit.map((s) => s.filter((h) => !gizli.includes(h.name))).filter((s) => s.length) };
    delete yeni.uid;
    await cm.updateConfiguration(tip, yeni);
  }

  const BA = app.documents('api::bulten-ayari.bulten-ayari');
  if (!(await BA.findFirst())) await BA.create({ data: { aktif: false, ciftOnay: true, footerda: true, anasayfada: false, kampanyalarda: true, blogda: true } });

  const CA = app.documents('api::cark-ayari.cark-ayari');
  const ca = await CA.findFirst();
  if (ca && ca.pasTekrarHakki == null) await CA.update({ documentId: ca.documentId, data: { pasTekrarHakki: 1 } });

  const sozluk = app.documents('api::arayuz-metni.arayuz-metni');
  const kural = await sozluk.findFirst({ filters: { anahtar: 'cark.kural' } });
  if (kural && kural.metin === 'E-posta başına bir hak. Kupon tek kullanımlıktır.') {
    await sozluk.update({ documentId: kural.documentId, data: { metin: 'E-posta başına bir ödül. PAS gelirse tekrar deneme hakkın olabilir. Kupon tek kullanımlıktır.' } });
  }

  const { tokenUret } = require('../src/yardimci/abone');
  const pazarlama = await app.db.query('api::cark-katilimi.cark-katilimi').findMany({ where: { pazarlamaOnay: true }, orderBy: { createdAt: 'asc' } });
  let aktarilan = 0;
  for (const k of pazarlama) {
    const eposta = String(k.eposta).trim().toLocaleLowerCase('tr');
    if (await app.db.query('api::abone.abone').findOne({ where: { eposta } })) continue;
    await app.documents('api::abone.abone').create({
      data: {
        eposta,
        durum: 'aktif',
        kaynak: 'cark',
        sonKaynak: 'cark',
        izinMetni: 'Kampanya ve fırsatlardan e-posta ile haberdar olmak istiyorum. (İsteğe bağlı)',
        izinTarihi: k.createdAt,
        izinIp: k.ip || null,
        onayYontemi: 'tek-adim',
        onayTarihi: k.createdAt,
        onayIp: k.ip || null,
        token: tokenUret(),
        notlar: 'Çark katılımındaki kampanya izninden aktarıldı.',
      },
    });
    aktarilan++;
  }
  console.log(`bulten hazir, aktarilan abone: ${aktarilan}`);
  await new Promise((r) => setTimeout(r, 5000));
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
