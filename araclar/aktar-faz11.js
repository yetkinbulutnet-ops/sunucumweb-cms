const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const DIZIN = path.join(__dirname, 'faz11');
const VERI = JSON.parse(fs.readFileSync(path.join(DIZIN, 'veri.json'), 'utf8'));
const BELGE = 'api::yasal-belge.yasal-belge';
const BANKA = 'api::banka-sayfasi.banka-sayfasi';
const SAYFA = 'api::sayfa-metni.sayfa-metni';
const AYAR = 'api::site-ayari.site-ayari';
const SOZLUK = 'api::arayuz-metni.arayuz-metni';

const TIPLER = {
  [BANKA]: {
    ad: ['Kayıt adı', ''],
    ust: ['Sayfa üstü ve arama motoru metinleri', ''],
    hesaplar: ['Banka hesapları', 'Sayfada bu sırayla gösterilir. IBAN boşluklu ya da boşluksuz girilebilir'],
    uyari: ['Güvenlik uyarısı', 'Hesap kartlarının altında sarı kutuda görünür'],
    odemeYontemleri: ['Ödeme yöntemleri', 'Yan kutudaki maddeler'],
    havaleBaslik: ['Havale notları başlığı', ''],
    havaleNotlari: ['Havale notları', 'Her satıra bir madde'],
    sss: ['Sık sorulan sorular', ''],
  },
  [BELGE]: {
    grup: ['Grup', 'Liste sayfasında belgeler bu gruba göre ayrılır: sozlesme ya da politika'],
    surum: ['Sürüm', 'ör. 1.0'],
    yururlukTarihi: ['Yürürlük tarihi', 'Belgenin ve PDF dosyasının başında görünür'],
  },
  [SAYFA]: {
    legal: ['Yasal belgeler sayfası', ''],
    yasalSss: ['Yasal belgeler SSS', 'Yasal belgeler sayfasının altındaki sorular'],
  },
};
const BILESENLER = {
  'odeme.banka-hesabi': {
    banka: ['Banka adı', 'ör. Enpara.com'],
    hesapSahibi: ['Hesap sahibi', ''],
    iban: ['IBAN', 'TR ile başlar, ör. TR00 0000 0000 0000 0000 0000 00'],
    paraBirimi: ['Para birimi', ''],
    logo: ['Banka logosu', 'Şeffaf zeminli PNG ya da SVG önerilir'],
    aciklama: ['Not', 'İsteğe bağlı, kartın altında görünür'],
  },
};
const GIZLI = { [BANKA]: { mainField: 'ad', alanlar: ['ad'] } };

const etiketle = async (app) => {
  const cm = app.plugin('content-manager');
  const isle = async (servis, tip, alanlar) => {
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
    delete yeni.uid;
    delete yeni.isComponent;
    delete yeni.category;
    await servis.updateConfiguration(tip, yeni);
  };
  for (const [uid, alanlar] of Object.entries(TIPLER)) await isle(cm.service('content-types'), app.contentTypes[uid], alanlar);
  for (const [uid, alanlar] of Object.entries(BILESENLER)) await isle(cm.service('components'), app.components[uid], alanlar);
};

const idSil = (o) => {
  if (Array.isArray(o)) return o.map(idSil);
  if (o && typeof o === 'object') {
    const y = {};
    for (const [k, v] of Object.entries(o)) if (k !== 'id' && k !== '__component') y[k] = idSil(v);
    return y;
  }
  return o;
};

const sozlukYukle = async (app) => {
  const S = app.documents(SOZLUK);
  const mevcut = new Set((await app.db.query(SOZLUK).findMany({ select: ['anahtar'] })).map((x) => x.anahtar));
  let yeni = 0;
  for (const e of ['L.json', 'M.json'].flatMap((f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'sozluk', f), 'utf8')))) {
    if (mevcut.has(e.anahtar)) continue;
    await S.create({ data: e });
    yeni += 1;
  }
  return yeni;
};

const logoYukle = async (app) => {
  const dosya = path.join(DIZIN, VERI.banka.logo);
  const [y] = await app
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name: VERI.banka.logo, alternativeText: VERI.banka.hesaplar[0].banka, caption: '' } },
      files: { filepath: dosya, originalFilename: VERI.banka.logo, mimetype: 'image/png', size: fs.statSync(dosya).size },
    });
  return y.id;
};

const bankaKur = async (app) => {
  const D = app.documents(BANKA);
  const m = await D.findFirst();
  if (m) return 'zaten var';
  const logo = await logoYukle(app);
  const b = VERI.banka;
  await D.create({
    data: {
      ad: 'Banka Hesapları',
      ust: b.ust,
      hesaplar: b.hesaplar.map((h) => ({ ...h, logo })),
      uyari: b.uyari,
      odemeYontemleri: b.odemeYontemleri,
      havaleBaslik: b.havaleBaslik,
      havaleNotlari: b.havaleNotlari,
      sss: b.sss,
    },
  });
  return 'oluşturuldu';
};

const sayfaMetni = async (app) => {
  const D = app.documents(SAYFA);
  const m = await D.findFirst({ populate: { yasalSss: true } });
  if (!m) return 'kayıt yok';
  const data = { legal: VERI.legalUst };
  if (!(m.yasalSss || []).length) data.yasalSss = VERI.yasalSss;
  await D.update({ documentId: m.documentId, data });
  return 'güncellendi';
};

const belgeler = async (app) => {
  const D = app.documents(BELGE);
  const eskiYeni = VERI.eskiSlug;
  const sonuc = [];
  for (const [i, slug] of VERI.sira.entries()) {
    const meta = JSON.parse(fs.readFileSync(path.join(DIZIN, 'belgeler', `${slug}.json`), 'utf8'));
    const icerik = fs.readFileSync(path.join(DIZIN, 'belgeler', `${slug}.md`), 'utf8').trim();
    const data = {
      baslik: meta.baslik,
      slug,
      kisaAd: meta.kisaAd,
      ozet: meta.ozet,
      seoAciklama: meta.seoAciklama,
      ikon: meta.ikon,
      grup: meta.grup,
      surum: VERI.surum,
      yururlukTarihi: VERI.yururluk,
      sira: (i + 1) * 10,
      icerik,
    };
    const eski = Object.keys(eskiYeni).find((k) => eskiYeni[k] === slug);
    let m = await D.findFirst({ filters: { slug }, status: 'draft' });
    if (!m && eski) m = await D.findFirst({ filters: { slug: eski }, status: 'draft' });
    if (m) {
      await D.update({ documentId: m.documentId, data });
      sonuc.push(`${slug}: taslak güncellendi`);
    } else {
      await D.create({ data });
      sonuc.push(`${slug}: taslak oluşturuldu`);
    }
  }
  return sonuc;
};

const yayinla = async (app) => {
  const D = app.documents(BELGE);
  const sonuc = [];
  for (const slug of VERI.sira) {
    const m = await D.findFirst({ filters: { slug }, status: 'draft' });
    if (!m) {
      sonuc.push(`${slug}: bulunamadı`);
      continue;
    }
    await D.publish({ documentId: m.documentId });
    sonuc.push(`${slug}: yayınlandı`);
  }
  return sonuc;
};

const menuler = async (app) => {
  const D = app.documents(AYAR);
  const a = await D.findFirst({ populate: { ustMenu: { populate: { ogeler: true } }, altMenuler: { populate: { baglantilar: true } } } });
  if (!a) return 'kayıt yok';
  const alt = idSil(a.altMenuler || []);
  const grup = alt.find((g) => g.baslik === VERI.altMenu.grup);
  let degisti = false;
  if (grup) {
    const i = grup.baglantilar.findIndex((b) => b.adres === VERI.altMenu.eski || b.adres === VERI.altMenu.yeni.adres);
    if (i >= 0 && grup.baglantilar[i].adres === VERI.altMenu.eski) {
      grup.baglantilar[i] = { ...grup.baglantilar[i], ...VERI.altMenu.yeni };
      degisti = true;
    }
    if (!grup.baglantilar.some((b) => b.adres === VERI.altMenu.ek.adres)) {
      const j = grup.baglantilar.findIndex((b) => b.adres === VERI.altMenu.yeni.adres);
      grup.baglantilar.splice(j >= 0 ? j + 1 : grup.baglantilar.length, 0, VERI.altMenu.ek);
      degisti = true;
    }
  }
  const ust = idSil(a.ustMenu || []);
  const kolon = ust.find((g) => g.etiket === VERI.ustMenu.etiket);
  if (kolon) {
    const i = kolon.ogeler.findIndex((o) => o.adres === VERI.ustMenu.eski);
    if (i >= 0) {
      kolon.ogeler[i] = { ...kolon.ogeler[i], ...VERI.ustMenu.yeni };
      degisti = true;
    }
    if (!kolon.ogeler.some((o) => o.adres === VERI.ustMenu.ek.adres)) {
      const j = kolon.ogeler.findIndex((o) => o.adres === VERI.ustMenu.yeni.adres);
      kolon.ogeler.splice(j >= 0 ? j + 1 : kolon.ogeler.length, 0, VERI.ustMenu.ek);
      degisti = true;
    }
  }
  if (!degisti) return 'değişiklik yok';
  await D.update({ documentId: a.documentId, data: { altMenuler: alt, ustMenu: ust } });
  return 'güncellendi';
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  try {
    if (process.argv.includes('--yayinla')) {
      console.log((await yayinla(app)).join('\n'));
    } else {
      await etiketle(app);
      console.log('etiketler tamam');
      console.log(`sözlük yeni: ${await sozlukYukle(app)}`);
      console.log(`banka sayfası: ${await bankaKur(app)}`);
      console.log(`sayfa metinleri: ${await sayfaMetni(app)}`);
      console.log((await belgeler(app)).join('\n'));
      if (process.argv.includes('--menu')) console.log(`menüler: ${await menuler(app)}`);
    }
  } finally {
    await app.destroy();
  }
  process.exit(0);
})().catch((h) => {
  console.error(h);
  process.exit(1);
});
