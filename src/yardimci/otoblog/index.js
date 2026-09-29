'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const ds = require('./deepseek');
const k = require('./kalite');
const { kapakUret } = require('./kapak');
const varsayilan = require('./varsayilan');
const sablon = require('../../guvenlik/sablon');

const AYAR = 'api::otomatik-blog.otomatik-blog';
const KONU = 'api::blog-konu.blog-konu';
const KAYIT = 'api::otomatik-blog-kaydi.otomatik-blog-kaydi';
const BLOG = 'api::blog-yazisi.blog-yazisi';
const KAT = 'api::blog-kategorisi.blog-kategorisi';
const YAZAR = 'api::blog-yazari.blog-yazari';
const PANEL = (process.env.PANEL_URL || 'https://cms.sunucumweb.com').replace(/\/+$/, '');
const SITE = (process.env.SITE_PUBLIC_URL || 'https://sunucumweb.com').replace(/\/+$/, '');
const BENZER_ESIK = 0.55;

const SABIT_SAYFALAR = {
  '/': 'Ana sayfa',
  '/alan-adi': 'Alan adı sorgulama ve kayıt',
  '/transfer': 'Alan adı transferi',
  '/araclar': 'Ücretsiz ağ ve site araçları',
  '/kampanyalar': 'Kampanyalar',
  '/hakkimizda': 'Hakkımızda',
  '/iletisim': 'İletişim',
  '/hazir-yazilim': 'Hazır yazılımlar',
  '/blog': 'Blog',
};

const PLAN_SEMA = JSON.stringify(
  {
    baslik: 'yazı başlığı',
    seoBaslik: 'arama sonucu başlığı',
    seoAciklama: 'arama sonucu açıklaması',
    ozet: 'liste sayfasında görünen kısa özet',
    kategori: 'kategori slug',
    etiketler: ['etiket'],
    bolumler: [{ baslik: 'bölüm başlığı', altBasliklar: ['alt başlık'], notlar: 'bu bölümde anlatılacaklar' }],
    sss: [{ soru: 'soru', cevap: 'cevap' }],
  },
  null,
  1
);

const ONERI_SEMA = JSON.stringify({ konular: [{ konu: 'yazı konusu', anahtarKelime: 'hedef anahtar kelime', kategori: 'kategori slug', notlar: 'yazara not' }] }, null, 1);

let calisiyor = false;

const doldur = (sablonMetni, degerler) => String(sablonMetni || '').replace(/\{(\w+)\}/g, (t, a) => (a in degerler ? String(degerler[a] ?? '') : t));

const istanbulGunu = (d = new Date()) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
const istanbulSaati = (d = new Date()) => Number(new Date(d).toLocaleString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }));
const gunFarki = (a, b) => Math.round((Date.parse(istanbulGunu(a)) - Date.parse(istanbulGunu(b))) / 864e5);

const ayarGetir = async () => {
  const S = strapi.documents(AYAR);
  let a = await S.findFirst({ populate: ['yazar'] });
  if (!a) {
    const yazar = await strapi.documents(YAZAR).findFirst({ filters: { slug: 'sunucumweb-ekibi' }, status: 'published' });
    a = await S.create({ data: { ...varsayilan, yazar: yazar?.documentId || null } });
    a = await S.findFirst({ populate: ['yazar'] });
  }
  return a;
};

const kategoriler = async () => strapi.documents(KAT).findMany({ status: 'published', fields: ['ad', 'slug'], sort: ['sira:asc'], limit: 100 });

const mevcutYazilar = async () => {
  const [taslak, yayinda] = await Promise.all([
    strapi.documents(BLOG).findMany({ status: 'draft', fields: ['baslik', 'slug'], limit: 1000 }),
    strapi.documents(BLOG).findMany({ status: 'published', fields: ['baslik', 'slug'], limit: 1000 }),
  ]);
  const yayindaSet = new Set(yayinda.map((y) => y.documentId));
  return taslak.map((y) => ({ ...y, yayinda: yayindaSet.has(y.documentId) }));
};

const siteSayfalari = async (yazilar) => {
  const sayfalar = new Map();
  try {
    const r = await fetch(`${(process.env.SITE_INTERNAL_URL || 'http://127.0.0.1:3800').replace(/\/+$/, '')}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    const xml = await r.text();
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const y = k.yolNormal(loc);
      if (!y || /^\/(hazir-yazilim\/|legal|araclar\/dns\/|blog\/(sayfa|kategori)\b)/.test(y)) continue;
      sayfalar.set(y, SABIT_SAYFALAR[y] || '');
    }
  } catch (e) {
    strapi.log.warn(`otoblog: site haritasi okunamadi (${e.message})`);
  }
  for (const [y, ad] of Object.entries(SABIT_SAYFALAR)) if (!sayfalar.has(y)) sayfalar.set(y, ad);
  const urunler = await strapi.documents('api::urun.urun').findMany({ status: 'published', fields: ['baslik', 'slug', 'durum'], limit: 100 });
  for (const u of urunler) if (u.durum !== 'yapim-asamasi') sayfalar.set(`/${u.slug}`, u.baslik);
  const araclar = await strapi.db.query('api::arac.arac').findMany({ select: ['baslik', 'slug'], limit: 100 });
  for (const a of araclar) sayfalar.set(`/araclar/${a.slug}`, a.baslik);
  for (const y of yazilar) if (y.yayinda) sayfalar.set(`/blog/${y.slug}`, y.baslik);
  for (const [y, ad] of sayfalar) if (!ad) sayfalar.delete(y);
  return sayfalar;
};

const sayfaListesi = (sayfalar) => [...sayfalar].map(([y, ad]) => `${y} : ${ad}`).join('\n');

const kaydet = (data) => strapi.documents(KAYIT).create({ data }).catch((e) => strapi.log.error(`otoblog: kayit yazilamadi (${e.message})`));

const yoneticiler = async () =>
  (await strapi.db.query('admin::user').findMany({ where: { isActive: true, blocked: false }, select: ['email'] })).map((u) => u.email).filter(Boolean);

const bildir = async (paket) => {
  for (const to of await yoneticiler()) {
    await strapi
      .plugin('email')
      .service('email')
      .send({ to, from: process.env.MAIL_FROM, subject: paket.subject, html: paket.html, text: paket.text })
      .catch((e) => strapi.log.error(`otoblog: e-posta gonderilemedi (${e.message})`));
  }
};

const sonHataTekrarMi = async (ayrinti) => {
  const son = await strapi.db.query(KAYIT).findOne({ where: { sonuc: { $in: ['hata', 'atlandi'] } }, orderBy: { createdAt: 'desc' } });
  return !!son && son.ayrinti === ayrinti && Date.now() - new Date(son.createdAt).getTime() < 24 * 3600e3;
};

const hataKaydet = async ({ tur, baslik, ayrinti, sonuc = 'hata', ayar }) => {
  const tekrar = tur === 'zamanli' && (await sonHataTekrarMi(ayrinti));
  if (tekrar) return;
  await kaydet({ tur, baslik, sonuc, ayrinti });
  if (ayar?.bildirim && tur === 'zamanli') await bildir(sablon.otoBlogSorun({ ayrinti, baglanti: `${PANEL}/admin/yonetim/otomatik-blog` }));
};

const kapakYukle = async (baslik, kategoriAdi, slug) => {
  const veri = await kapakUret({ baslik, kategori: kategoriAdi });
  const dosya = path.join(os.tmpdir(), `swb-kapak-${slug}-${Date.now()}.webp`);
  fs.writeFileSync(dosya, veri);
  try {
    const [y] = await strapi.plugin('upload').service('upload').upload({
      data: { fileInfo: { name: `${slug}.webp`, alternativeText: baslik, caption: baslik } },
      files: { filepath: dosya, originalFilename: `${slug}.webp`, mimetype: 'image/webp', size: veri.length },
    });
    return y.id;
  } finally {
    fs.rmSync(dosya, { force: true });
  }
};

const benzersizSlug = async (taban) => {
  let s = taban || `yazi-${Date.now()}`;
  for (let i = 2; await strapi.db.query(BLOG).findOne({ where: { slug: s }, select: ['id'] }); i += 1) s = `${taban}-${i}`;
  return s;
};

const enBenzer = (metin, yazilar) => {
  let en = { oran: 0, baslik: '' };
  for (const y of yazilar) {
    const oran = k.benzerlik(metin, y.baslik);
    if (oran > en.oran) en = { oran, baslik: y.baslik };
  }
  return en;
};

const konuSec = async (konuId) => {
  if (konuId) return strapi.db.query(KONU).findOne({ where: { id: konuId }, populate: ['kategori'] });
  return strapi.db.query(KONU).findOne({ where: { durum: 'sirada' }, orderBy: [{ oncelik: 'desc' }, { createdAt: 'asc' }], populate: ['kategori'] });
};

const konuGuncelle = (id, data) => strapi.db.query(KONU).update({ where: { id }, data });

const yaziUret = async ({ tur = 'elle', konuId } = {}) => {
  if (calisiyor) return { hata: 'Şu an zaten bir yazı üretiliyor, bitince tekrar deneyin.' };
  calisiyor = true;
  const bas = Date.now();
  const kullanim = { girdi: 0, cikti: 0 };
  const topla = (u) => {
    kullanim.girdi += u.girdi;
    kullanim.cikti += u.cikti;
  };
  let ayar;
  let konu;
  try {
    ayar = await ayarGetir();
    if (!ds.hazirMi()) {
      await hataKaydet({ tur, ayar, ayrinti: 'DeepSeek API anahtarı tanımlı değil.' });
      return { hata: 'DeepSeek API anahtarı tanımlı değil.' };
    }
    const yazilar = await mevcutYazilar();
    for (let deneme = 0; deneme < 5; deneme += 1) {
      konu = await konuSec(konuId);
      if (!konu) break;
      const b = enBenzer(`${konu.konu} ${konu.anahtarKelime || ''}`, yazilar);
      if (b.oran < BENZER_ESIK) break;
      await konuGuncelle(konu.id, { durum: 'atlandi', sonuc: `Sitede benzer bir yazı var: ${b.baslik}` });
      await kaydet({ tur, baslik: konu.konu, sonuc: 'atlandi', ayrinti: `Benzer yazı olduğu için atlandı: ${b.baslik}` });
      konu = null;
      if (konuId) break;
    }
    if (!konu) {
      await hataKaydet({ tur, ayar, sonuc: 'atlandi', ayrinti: 'Sırada yazılacak konu yok. Konu havuzuna konu ekleyin ya da yapay zekâ önerilerini onaylayın.' });
      return { hata: 'Sırada yazılacak konu yok.' };
    }
    await konuGuncelle(konu.id, { durum: 'yaziliyor', sonuc: null });

    const katlar = await kategoriler();
    const sayfalar = await siteSayfalari(yazilar);
    const yasakli = k.yasakliListe(ayar.yasakliIfadeler);
    const sistem = yasakli.length ? `${ayar.sistemTalimati}\n\nŞu ifadeleri hiçbir biçimde kullanma:\n${yasakli.join('\n')}` : ayar.sistemTalimati;
    const kelimeMin = ayar.kelimeMin || 1000;
    const kelimeMax = Math.max(ayar.kelimeMax || 1800, kelimeMin + 200);
    const ortak = {
      kategoriler: katlar.map((c) => `${c.slug}: ${c.ad}`).join('\n'),
      mevcut_yazilar: yazilar.map((y) => `- ${y.baslik}`).join('\n') || '(henüz yazı yok)',
      sayfalar: sayfaListesi(sayfalar),
      kelime_min: kelimeMin,
      kelime_max: kelimeMax,
    };

    const p = await ds.sohbet({
      model: ayar.model,
      sistem,
      json: true,
      sicaklik: 0.8,
      maxToken: 8000,
      mesaj: doldur(ayar.planSablonu, {
        ...ortak,
        konu: konu.konu,
        anahtar_kelime: konu.anahtarKelime || konu.konu,
        kategori: konu.kategori?.slug || '(sen seç)',
        notlar: konu.notlar || '-',
        sema: PLAN_SEMA,
      }),
    });
    topla(p.kullanim);
    const plan = p.veri || {};
    if (!plan.baslik || !Array.isArray(plan.bolumler) || plan.bolumler.length < 3) throw new Error('Yapay zekânın hazırladığı plan eksik geldi.');
    const baslik = k.kirp(plan.baslik, 110);
    const pb = enBenzer(baslik, yazilar);
    if (pb.oran >= 0.65) {
      await konuGuncelle(konu.id, { durum: 'atlandi', sonuc: `Plan başlığı mevcut bir yazıya çok benziyor: ${pb.baslik}` });
      await kaydet({ tur, baslik, sonuc: 'reddedildi', ayrinti: `Plan başlığı mevcut yazıya çok benziyor: ${pb.baslik}`, girdiToken: kullanim.girdi, ciktiToken: kullanim.cikti, sureSn: Math.round((Date.now() - bas) / 1000) });
      return { hata: 'Benzer yazı olduğu için bu konu atlandı.' };
    }

    const y = await ds.sohbet({
      model: ayar.model,
      sistem,
      maxToken: 16000,
      mesaj: doldur(ayar.yaziSablonu, { ...ortak, plan: JSON.stringify({ ...plan, sss: undefined }, null, 1) }),
    });
    topla(y.kullanim);
    const isle = (ham) => k.linkDuzelt(k.yapiDuzelt(k.temizle(ham), baslik), new Set(sayfalar.keys()));
    let govde = isle(y.metin);
    let denetim = k.sorunlariBul(govde.metin, { kelimeMin, kelimeMax, yasakli });
    if (denetim.sorunlar.length) {
      const d = await ds.sohbet({
        model: ayar.model,
        sistem,
        maxToken: 16000,
        sicaklik: 0.5,
        mesaj: doldur(ayar.duzeltmeSablonu, { sorunlar: denetim.sorunlar.map((s) => `- ${s}`).join('\n'), metin: govde.metin }),
      });
      topla(d.kullanim);
      const yeni = isle(d.metin);
      const yeniDenetim = k.sorunlariBul(yeni.metin, { kelimeMin, kelimeMax, yasakli });
      if (yeniDenetim.sorunlar.length <= denetim.sorunlar.length && yeniDenetim.kelime >= denetim.kelime * 0.8) {
        govde = yeni;
        denetim = yeniDenetim;
      }
    }
    const uyarilar = [...denetim.sorunlar];
    if (govde.tutulan === 0) uyarilar.push('Yazıda site içi link yok.');

    const kat = katlar.find((c) => c.slug === plan.kategori) || katlar.find((c) => c.slug === konu.kategori?.slug) || katlar[0];
    const slug = await benzersizSlug(k.slugla(baslik));
    const kapak = await kapakYukle(baslik, kat?.ad || 'Blog', slug);
    const etiketler = (Array.isArray(plan.etiketler) ? plan.etiketler : [])
      .map((e) => k.kirp(e, 40))
      .filter(Boolean)
      .slice(0, 8)
      .join('\n');
    const sss = (Array.isArray(plan.sss) ? plan.sss : [])
      .filter((s) => s?.soru && s?.cevap)
      .slice(0, 6)
      .map((s) => ({ soru: k.kirp(s.soru, 250), cevap: k.tekSatir(s.cevap).slice(0, 1500) }));

    const yazi = await strapi.documents(BLOG).create({
      data: {
        baslik,
        slug,
        ozet: k.kirp(plan.ozet || baslik, 300),
        kapak,
        icerik: govde.metin,
        kategori: kat?.documentId || null,
        yazar: ayar.yazar?.documentId || null,
        etiketler,
        oneCikan: false,
        seoBaslik: k.kirp(plan.seoBaslik || baslik, 70),
        seoAciklama: k.kirp(plan.seoAciklama || plan.ozet || baslik, 170),
        sss,
      },
    });
    const yayinla = !!ayar.otoYayin && uyarilar.length === 0;
    if (yayinla) await strapi.documents(BLOG).publish({ documentId: yazi.documentId });

    const ayrinti = [
      `${denetim.kelime} kelime, ${denetim.h2} bölüm, ${govde.tutulan} site içi link, ${sss.length} SSS.`,
      govde.kaldirilan.length ? `Kaldırılan link: ${govde.kaldirilan.join(', ')}` : '',
      uyarilar.length ? `Kalite uyarısı: ${uyarilar.join(' ')}` : '',
      ayar.otoYayin && !yayinla ? 'Kalite uyarısı olduğu için otomatik yayınlanmadı, taslak olarak bekliyor.' : '',
    ]
      .filter(Boolean)
      .join('\n');
    await konuGuncelle(konu.id, { durum: 'yazildi', yazi: yazi.id, sonuc: yayinla ? 'Yayınlandı.' : 'Taslak olarak kaydedildi.' });
    await kaydet({ tur, baslik, sonuc: yayinla ? 'yayinlandi' : 'taslak', ayrinti, yazi: yazi.documentId, girdiToken: kullanim.girdi, ciktiToken: kullanim.cikti, sureSn: Math.round((Date.now() - bas) / 1000) });
    if (ayar.bildirim) {
      await bildir(
        sablon.otoBlogHazir({
          baslik,
          ozet: k.kirp(plan.ozet || '', 300),
          yayinda: yayinla,
          kelime: denetim.kelime,
          kategori: kat?.ad,
          uyarilar,
          panelUrl: `${PANEL}/admin/content-manager/collection-types/${BLOG}/${yazi.documentId}`,
          siteUrl: yayinla ? `${SITE}/blog/${slug}` : '',
        })
      );
    }
    strapi.log.info(`otoblog: ${yayinla ? 'yayinlandi' : 'taslak'} ${slug} (${denetim.kelime} kelime, ${kullanim.girdi}+${kullanim.cikti} token)`);
    return { tamam: true, yayinda: yayinla, documentId: yazi.documentId, baslik };
  } catch (e) {
    const mesaj = e instanceof ds.DeepseekHatasi ? e.message : `Yazı üretilemedi: ${e.message}`;
    strapi.log.error(`otoblog: ${e.stack || e.message}`);
    if (konu) {
      const geri = e instanceof ds.DeepseekHatasi && [0, 401, 402, 429, -1].includes(e.durum);
      await konuGuncelle(konu.id, { durum: geri ? 'sirada' : 'hata', sonuc: mesaj }).catch(() => {});
    }
    await hataKaydet({ tur, ayar, baslik: konu?.konu, ayrinti: mesaj });
    return { hata: mesaj };
  } finally {
    calisiyor = false;
  }
};

const konuOner = async ({ tur = 'elle' } = {}) => {
  if (calisiyor) return { hata: 'Şu an başka bir işlem çalışıyor, bitince tekrar deneyin.' };
  calisiyor = true;
  const bas = Date.now();
  let ayar;
  try {
    ayar = await ayarGetir();
    if (!ds.hazirMi()) return { hata: 'DeepSeek API anahtarı tanımlı değil.' };
    const [katlar, yazilar, havuz] = await Promise.all([
      kategoriler(),
      mevcutYazilar(),
      strapi.db.query(KONU).findMany({ where: { durum: { $in: ['sirada', 'onay-bekliyor', 'yaziliyor', 'atlandi'] } }, select: ['konu'], limit: 500 }),
    ]);
    const adet = ayar.oneriAdedi || 8;
    const { veri, kullanim } = await ds.sohbet({
      model: ayar.model,
      sistem: ayar.sistemTalimati,
      json: true,
      sicaklik: 0.9,
      maxToken: 6000,
      mesaj: doldur(ayar.oneriSablonu, {
        adet,
        kategoriler: katlar.map((c) => `${c.slug}: ${c.ad}`).join('\n'),
        mevcut_yazilar: yazilar.map((y) => `- ${y.baslik}`).join('\n') || '(henüz yazı yok)',
        havuz: havuz.map((h) => `- ${h.konu}`).join('\n') || '(boş)',
        sema: ONERI_SEMA,
      }),
    });
    const karsilastir = [...yazilar.map((y) => ({ baslik: y.baslik })), ...havuz.map((h) => ({ baslik: h.konu }))];
    const eklenen = [];
    for (const o of (Array.isArray(veri?.konular) ? veri.konular : []).slice(0, adet)) {
      const konuMetni = k.kirp(o?.konu || '', 160);
      if (konuMetni.length < 8) continue;
      if (enBenzer(`${konuMetni} ${o.anahtarKelime || ''}`, karsilastir).oran >= BENZER_ESIK) continue;
      const kat = katlar.find((c) => c.slug === o.kategori);
      await strapi.documents(KONU).create({
        data: { konu: konuMetni, anahtarKelime: k.kirp(o.anahtarKelime || '', 100), notlar: k.tekSatir(o.notlar || '').slice(0, 2000), kategori: kat?.documentId || null, durum: 'onay-bekliyor', kaynak: 'yapay-zeka' },
      });
      karsilastir.push({ baslik: konuMetni });
      eklenen.push(konuMetni);
    }
    await kaydet({ tur: 'konu-onerisi', baslik: `${eklenen.length} konu önerisi`, sonuc: 'oneri', ayrinti: eklenen.join('\n') || 'Yeni ve farklı konu bulunamadı.', girdiToken: kullanim.girdi, ciktiToken: kullanim.cikti, sureSn: Math.round((Date.now() - bas) / 1000) });
    if (ayar.bildirim && eklenen.length) await bildir(sablon.otoBlogOneri({ konular: eklenen, baglanti: `${PANEL}/admin/yonetim/otomatik-blog` }));
    return { tamam: true, eklenen };
  } catch (e) {
    const mesaj = e instanceof ds.DeepseekHatasi ? e.message : `Konu önerilemedi: ${e.message}`;
    strapi.log.error(`otoblog oneri: ${e.stack || e.message}`);
    await hataKaydet({ tur: tur === 'zamanli' ? 'zamanli' : 'konu-onerisi', ayar, ayrinti: mesaj });
    return { hata: mesaj };
  } finally {
    calisiyor = false;
  }
};

const sonZamanliUretim = () =>
  strapi.db.query(KAYIT).findOne({ where: { tur: { $in: ['zamanli', 'elle'] }, sonuc: { $in: ['taslak', 'yayinlandi', 'reddedildi'] } }, orderBy: { createdAt: 'desc' } });

const sonrakiCalisma = async (ayar) => {
  if (!ayar?.aktif) return null;
  const son = await sonZamanliUretim();
  const simdi = new Date();
  let gun = istanbulGunu(simdi);
  if (son) {
    const hedef = new Date(Date.parse(istanbulGunu(son.createdAt)) + (ayar.periyotGun || 2) * 864e5);
    if (hedef.toISOString().slice(0, 10) > gun) gun = hedef.toISOString().slice(0, 10);
  }
  if (gun === istanbulGunu(simdi) && istanbulSaati(simdi) >= ayar.saat) return simdi.toISOString();
  return new Date(`${gun}T${String(ayar.saat).padStart(2, '0')}:00:00+03:00`).toISOString();
};

const zamanlayici = async () => {
  if (calisiyor) return;
  try {
    const ayar = await ayarGetir();
    if (!ayar.aktif) return;
    const siradaki = await strapi.db.query(KONU).count({ where: { durum: 'sirada' } });
    const bekleyen = await strapi.db.query(KONU).count({ where: { durum: 'onay-bekliyor' } });
    const son = await sonZamanliUretim();
    const vakit = istanbulSaati() >= ayar.saat && (!son || gunFarki(new Date(), son.createdAt) >= (ayar.periyotGun || 2));
    if (vakit && siradaki > 0) await yaziUret({ tur: 'zamanli' });
    else if (vakit) await hataKaydet({ tur: 'zamanli', ayar, sonuc: 'atlandi', ayrinti: 'Sırada yazılacak konu yok. Konu havuzuna konu ekleyin ya da yapay zekâ önerilerini onaylayın.' });
    const kalan = await strapi.db.query(KONU).count({ where: { durum: 'sirada' } });
    const sonOneri = await strapi.db.query(KAYIT).findOne({ where: { tur: 'konu-onerisi' }, orderBy: { createdAt: 'desc' } });
    const oneriVakti = !sonOneri || Date.now() - new Date(sonOneri.createdAt).getTime() > 24 * 3600e3;
    if (ayar.oneriEsigi > 0 && kalan < ayar.oneriEsigi && bekleyen === 0 && oneriVakti) await konuOner({ tur: 'zamanli' });
  } catch (e) {
    strapi.log.error(`otoblog zamanlayici: ${e.message}`);
  }
};

const durum = async () => {
  const ayar = await ayarGetir();
  const konuAlanlari = { select: ['id', 'konu', 'anahtarKelime', 'notlar', 'kaynak', 'oncelik'], populate: { kategori: { select: ['ad'] } } };
  const [sayilar, kayitlar, bakiye, oneriler, siradakiler] = await Promise.all([
    Promise.all(['sirada', 'onay-bekliyor', 'yazildi', 'atlandi', 'hata'].map((d) => strapi.db.query(KONU).count({ where: { durum: d } }))),
    strapi.db.query(KAYIT).findMany({ orderBy: { createdAt: 'desc' }, limit: 15, populate: { yazi: { select: ['documentId', 'slug', 'publishedAt'] } } }),
    ds.hazirMi() ? ds.bakiye().catch((e) => ({ hata: e.message })) : Promise.resolve({ hata: 'DeepSeek API anahtarı tanımlı değil.' }),
    strapi.db.query(KONU).findMany({ where: { durum: 'onay-bekliyor' }, orderBy: { createdAt: 'asc' }, limit: 50, ...konuAlanlari }),
    strapi.db.query(KONU).findMany({ where: { durum: 'sirada' }, orderBy: [{ oncelik: 'desc' }, { createdAt: 'asc' }], limit: 5, ...konuAlanlari }),
  ]);
  const [sirada, onayBekliyor, yazildi, atlandi, hata] = sayilar;
  return {
    ayar: { aktif: !!ayar.aktif, otoYayin: !!ayar.otoYayin, periyotGun: ayar.periyotGun, saat: ayar.saat, bildirim: !!ayar.bildirim, model: ayar.model },
    sonraki: await sonrakiCalisma(ayar),
    calisiyor,
    anahtar: ds.hazirMi(),
    bakiye,
    havuz: { sirada, onayBekliyor, yazildi, atlandi, hata },
    oneriler,
    siradakiler,
    kayitlar,
  };
};

const konuDurumu = async (id, yeni) => {
  if (!['sirada', 'atlandi'].includes(yeni)) return null;
  const konu = await strapi.db.query(KONU).findOne({ where: { id }, select: ['id', 'durum'] });
  if (!konu || konu.durum === 'yaziliyor') return null;
  return konuGuncelle(id, { durum: yeni, sonuc: null });
};

const onaylaBekleyenler = async () => {
  const r = await strapi.db.query(KONU).updateMany({ where: { durum: 'onay-bekliyor' }, data: { durum: 'sirada' } });
  return r?.count || 0;
};

module.exports = { yaziUret, konuOner, zamanlayici, durum, ayarGetir, onaylaBekleyenler, konuDurumu, mesgulMu: () => calisiyor };
