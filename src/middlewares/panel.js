'use strict';

const s = require('../guvenlik/servis');
const mesaj = require('../yardimci/mesaj');
const otoblog = require('../yardimci/otoblog');

const UMAMI = (process.env.UMAMI_URL || 'https://istatistik.yetkinweb.com').replace(/\/+$/, '');
const SAAT_DILIMI = 'Europe/Istanbul';
let umamiToken = null;
const onbellek = new Map();

const hata = (ctx, status, message) => {
  ctx.status = status;
  ctx.body = { data: null, error: { status, message } };
};

const umamiGiris = async () => {
  const r = await fetch(`${UMAMI}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.UMAMI_KULLANICI, password: process.env.UMAMI_SIFRE }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`umami giris ${r.status}`);
  umamiToken = (await r.json()).token;
};

const umamiGet = async (yol, tekrar = true) => {
  if (!umamiToken) await umamiGiris();
  const r = await fetch(`${UMAMI}/api${yol}`, { headers: { Authorization: `Bearer ${umamiToken}`, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  if (r.status === 401 && tekrar) {
    umamiToken = null;
    return umamiGet(yol, false);
  }
  if (!r.ok) throw new Error(`umami ${r.status} ${yol.split('?')[0]}`);
  return r.json();
};

const istanbulParcalari = (d) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: SAAT_DILIMI, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  return p;
};

const ARALIKLAR = {
  gun: { ms: 24 * 3600e3, birim: 'hour' },
  '7g': { ms: 7 * 864e5, birim: 'day' },
  '30g': { ms: 30 * 864e5, birim: 'day' },
  '90g': { ms: 90 * 864e5, birim: 'day' },
};

const kovalar = (baslangic, bitis, birim) => {
  const liste = [];
  const adim = birim === 'hour' ? 3600e3 : 864e5;
  const gorulen = new Set();
  for (let t = baslangic; t < bitis + adim; t += adim) {
    const p = istanbulParcalari(new Date(Math.min(t, bitis)));
    const anahtar = birim === 'hour' ? `${p.year}-${p.month}-${p.day} ${p.hour}:00:00` : `${p.year}-${p.month}-${p.day} 00:00:00`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    liste.push(anahtar);
  }
  return liste;
};

const doldur = (anahtarlar, dizi) => {
  const m = new Map((dizi || []).map((x) => [String(x.x).slice(0, 19), x.y]));
  return anahtarlar.map((a) => ({ x: a, y: m.get(a) || 0 }));
};

const istatistik = async (aralik) => {
  const a = ARALIKLAR[aralik] || ARALIKLAR['30g'];
  const anahtar = aralik in ARALIKLAR ? aralik : '30g';
  const o = onbellek.get(anahtar);
  if (o && Date.now() - o.zaman < 60000) return o.veri;
  const site = process.env.UMAMI_SITE;
  if (!site || !process.env.UMAMI_KULLANICI) throw new Error('yapilandirilmamis');
  const bitis = Date.now();
  const baslangic = bitis - a.ms;
  const q = `startAt=${baslangic}&endAt=${bitis}`;
  const metrik = (tur, limit = 8) => umamiGet(`/websites/${site}/metrics?${q}&type=${tur}&limit=${limit}`).catch(() => []);
  const oq = `startAt=${baslangic - a.ms}&endAt=${baslangic}`;
  const tz = encodeURIComponent(SAAT_DILIMI);
  const [ozet, seri, oncekiSeri, iller, aktif, sayfalar, girisler, kaynaklar, ulkeler, sehirler, tarayicilar, sistemler, cihazlar] = await Promise.all([
    umamiGet(`/websites/${site}/stats?${q}`),
    umamiGet(`/websites/${site}/pageviews?${q}&unit=${a.birim}&timezone=${tz}`),
    umamiGet(`/websites/${site}/pageviews?${oq}&unit=${a.birim}&timezone=${tz}`).catch(() => ({ pageviews: [] })),
    umamiGet(`/websites/${site}/metrics?${q}&type=region&country=TR&limit=100`).catch(() => []),
    umamiGet(`/websites/${site}/active`).catch(() => ({ visitors: 0 })),
    metrik('path', 10),
    metrik('entry', 8),
    metrik('referrer', 8),
    metrik('country', 8),
    metrik('city', 8),
    metrik('browser', 6),
    metrik('os', 6),
    metrik('device', 5),
  ]);
  const anahtarlar = kovalar(baslangic, bitis, a.birim);
  const deger = (k) => (typeof ozet[k] === 'object' && ozet[k] !== null ? ozet[k].value : ozet[k]) || 0;
  const onceki = (k) => (ozet.comparison ? ozet.comparison[k] : typeof ozet[k] === 'object' ? ozet[k]?.prev : 0) || 0;
  const alanlar = ['pageviews', 'visitors', 'visits', 'bounces', 'totaltime'];
  const veri = {
    aralik: anahtar,
    birim: a.birim,
    ozet: Object.fromEntries(alanlar.map((k) => [k, { deger: deger(k), onceki: onceki(k) }])),
    seri: {
      goruntuleme: doldur(anahtarlar, seri.pageviews),
      ziyaret: doldur(anahtarlar, seri.sessions),
      onceki: doldur(kovalar(baslangic - a.ms, baslangic, a.birim), oncekiSeri.pageviews).slice(-anahtarlar.length).map((v, i) => ({ x: anahtarlar[i], y: v.y })),
    },
    iller: (iller || []).filter((x) => /^TR-\d{2}$/.test(x.x)).map((x) => ({ plaka: Number(x.x.slice(3)), y: x.y })),
    aktif: aktif?.visitors ?? aktif?.x ?? 0,
    listeler: { sayfalar, girisler, kaynaklar, ulkeler, sehirler, tarayicilar, sistemler, cihazlar },
    raporAdresi: process.env.UMAMI_PAYLASIM_URL || 'https://istatistik.yetkinweb.com/share/wZZElSlME9SkBQua',
  };
  onbellek.set(anahtar, { zaman: Date.now(), veri });
  return veri;
};

const ilIstatistik = async (kod, aralik) => {
  const a = ARALIKLAR[aralik] || ARALIKLAR['30g'];
  const anahtar = `il:${kod}:${aralik}`;
  const o = onbellek.get(anahtar);
  if (o && Date.now() - o.zaman < 60000) return o.veri;
  const site = process.env.UMAMI_SITE;
  const bitis = Date.now();
  const q = `startAt=${bitis - a.ms}&endAt=${bitis}&region=${kod}`;
  const [ozet, ilceler, sayfalar, kaynaklar, cihazlar] = await Promise.all([
    umamiGet(`/websites/${site}/stats?${q}`),
    umamiGet(`/websites/${site}/metrics?${q}&type=city&limit=8`).catch(() => []),
    umamiGet(`/websites/${site}/metrics?${q}&type=path&limit=6`).catch(() => []),
    umamiGet(`/websites/${site}/metrics?${q}&type=referrer&limit=5`).catch(() => []),
    umamiGet(`/websites/${site}/metrics?${q}&type=device&limit=4`).catch(() => []),
  ]);
  const d = (k) => (typeof ozet[k] === 'object' && ozet[k] !== null ? ozet[k].value : ozet[k]) || 0;
  const veri = { kod, ozet: { visitors: d('visitors'), pageviews: d('pageviews'), visits: d('visits'), bounces: d('bounces'), totaltime: d('totaltime') }, ilceler, sayfalar, kaynaklar, cihazlar };
  onbellek.set(anahtar, { zaman: Date.now(), veri });
  return veri;
};

const say = (uid, where) =>
  strapi.contentTypes[uid] ? (where ? strapi.db.query(uid).count({ where }) : strapi.documents(uid).count({})).catch(() => null) : Promise.resolve(null);

const TIPLER = [
  'api::urun.urun', 'api::plan.plan', 'api::kampanya.kampanya', 'api::hazir-yazilim.hazir-yazilim', 'api::yazilim-kategorisi.yazilim-kategorisi',
  'api::blog-yazisi.blog-yazisi', 'api::blog-kategorisi.blog-kategorisi', 'api::blog-yazari.blog-yazari', 'api::duyuru.duyuru', 'api::anasayfa-slayti.anasayfa-slayti',
  'api::marka.marka', 'api::yasal-belge.yasal-belge', 'api::arac.arac', 'api::dns-kayit-tipi.dns-kayit-tipi', 'api::arayuz-metni.arayuz-metni',
  'api::cark-odulu.cark-odulu', 'api::cark-kuponu.cark-kuponu', 'api::cark-katilimi.cark-katilimi', 'api::abone.abone', 'api::iletisim-mesaji.iletisim-mesaji', 'api::blog-konu.blog-konu',
];

const ozet = async () => {
  const gun = new Date(Date.now() - 864e5);
  const hafta = new Date(Date.now() - 7 * 864e5);
  const ayar = await strapi.db.query('api::cark-ayari.cark-ayari').findOne({ select: ['aktif', 'donem'] });
  const bulten = await strapi.db.query('api::bulten-ayari.bulten-ayari').findOne({ select: ['aktif'] });
  const sayilar = Object.fromEntries(await Promise.all(TIPLER.map(async (u) => [u, await say(u)])));
  const [aktif, beklemede, iptal, yeniAbone, kuponKalan, kuponToplam, katilimGun, katilimDonem, kazanan, mesajlar, sonMesajlar, dosya] = await Promise.all([
    say('api::abone.abone', { durum: 'aktif' }),
    say('api::abone.abone', { durum: 'beklemede' }),
    say('api::abone.abone', { durum: 'iptal' }),
    say('api::abone.abone', { createdAt: { $gt: hafta } }),
    say('api::cark-kuponu.cark-kuponu', { kullanildi: false }),
    say('api::cark-kuponu.cark-kuponu', {}),
    say('api::cark-katilimi.cark-katilimi', { createdAt: { $gt: gun } }),
    ayar ? say('api::cark-katilimi.cark-katilimi', { donem: ayar.donem }) : 0,
    ayar ? say('api::cark-katilimi.cark-katilimi', { donem: ayar.donem, kupon: { $notNull: true } }) : 0,
    mesaj.mesajSayilari(),
    mesaj.mesajListesi({ durum: 'acik', boyut: 5 }),
    strapi.db.query('plugin::upload.file').count(),
  ]);
  return {
    sayilar,
    abone: { aktif, beklemede, iptal, yeni: yeniAbone, formlarAcik: !!bulten?.aktif },
    cark: { aktif: !!ayar?.aktif, donem: ayar?.donem || '', kuponKalan, kuponToplam, katilimGun, katilimDonem, kazanan },
    mesaj: { ...mesajlar, son: sonMesajlar.kayitlar },
    dosya,
  };
};

const telefonGetir = async (id) => (await strapi.db.connection('swb_telefon').where({ user_id: id }).first())?.telefon || '';
const telefonYaz = async (id, telefon) => {
  const t = String(telefon || '').replace(/[^\d+ ()-]/g, '').trim().slice(0, 32);
  const k = strapi.db.connection('swb_telefon');
  await k.clone().where({ user_id: id }).del();
  if (t) await k.clone().insert({ user_id: id, telefon: t, guncelleme: new Date() });
};

const telefonAyikla = (ctx) => {
  const b = ctx.request.body;
  if (!b || typeof b !== 'object' || !('telefon' in b)) return undefined;
  const t = b.telefon;
  delete b.telefon;
  return t;
};

const telefonEkle = async (veri) => {
  if (!veri || typeof veri !== 'object') return;
  if (Array.isArray(veri)) {
    const ids = veri.map((u) => u?.id).filter(Boolean);
    if (!ids.length) return;
    const satirlar = await strapi.db.connection('swb_telefon').whereIn('user_id', ids);
    const m = new Map(satirlar.map((x) => [x.user_id, x.telefon]));
    veri.forEach((u) => u && (u.telefon = m.get(u.id) || ''));
    return;
  }
  if (veri.id) veri.telefon = await telefonGetir(veri.id);
};

const panel = async (ctx) => {
  ctx.set('Cache-Control', 'no-store');
  const k = await s.tokenKullanici(ctx);
  if (!k) return hata(ctx, 401, 'Oturum geçersiz.');
  const kullanici = await strapi.db.query('admin::user').findOne({ where: { id: k.userId } });
  if (!kullanici || !kullanici.isActive || kullanici.blocked) return hata(ctx, 403, 'Yetkisiz.');
  const y = ctx.path.slice('/swb-panel'.length);
  const m = ctx.method;
  try {
    if (m === 'GET' && y === '/ozet') return (ctx.body = { data: await ozet() });
    if (m === 'GET' && y === '/istatistik') {
      try {
        return (ctx.body = { data: await istatistik(String(ctx.query.aralik || '30g')) });
      } catch (e) {
        strapi.log.warn(`panel istatistik: ${e.message}`);
        return hata(ctx, 502, 'İstatistik servisine şu an ulaşılamıyor.');
      }
    }
    if (m === 'GET' && y === '/istatistik/il') {
      const kod = String(ctx.query.kod || '');
      if (!/^TR-\d{2}$/.test(kod)) return hata(ctx, 400, 'Geçersiz il.');
      try {
        return (ctx.body = { data: await ilIstatistik(kod, String(ctx.query.aralik || '30g')) });
      } catch (e) {
        strapi.log.warn(`panel il: ${e.message}`);
        return hata(ctx, 502, 'İstatistik servisine şu an ulaşılamıyor.');
      }
    }
    if (m === 'GET' && y === '/site-durumu') {
      try {
        const r = await fetch(`${(process.env.SITE_INTERNAL_URL || 'http://127.0.0.1:3800').replace(/\/+$/, '')}/api/health`, { signal: AbortSignal.timeout(6000) });
        return (ctx.body = { data: await r.json() });
      } catch {
        return hata(ctx, 502, 'Site durumu alınamadı.');
      }
    }
    if (m === 'GET' && y === '/mesajlar') {
      const [liste, sayilar] = await Promise.all([mesaj.mesajListesi({ durum: String(ctx.query.durum || 'acik'), sayfa: Math.max(1, Number(ctx.query.sayfa) || 1) }), mesaj.mesajSayilari()]);
      return (ctx.body = { data: { ...liste, sayilar } });
    }
    const mm = y.match(/^\/mesajlar\/(\d+)(?:\/(yanit|durum))?$/);
    if (mm) {
      const id = Number(mm[1]);
      if (m === 'GET' && !mm[2]) {
        const kayit = await mesaj.mesajGetir(id);
        return kayit ? (ctx.body = { data: kayit }) : hata(ctx, 404, 'Mesaj bulunamadı.');
      }
      if (m === 'POST' && mm[2] === 'yanit') {
        const r = await mesaj.yanitGonder({ id, metin: ctx.request.body?.metin, kullanici });
        return r.hata ? hata(ctx, r.hata[0], r.hata[1]) : (ctx.body = { data: r.mesaj });
      }
      if (m === 'POST' && mm[2] === 'durum') {
        const r = await mesaj.durumDegistir(id, String(ctx.request.body?.durum || ''));
        return r ? (ctx.body = { data: r }) : hata(ctx, 400, 'Geçersiz durum.');
      }
    }
    if (y === '/otomatik-blog' && m === 'GET') return (ctx.body = { data: await otoblog.durum() });
    if (y === '/otomatik-blog/uret' || y === '/otomatik-blog/oner') {
      if (m !== 'POST') return hata(ctx, 405, 'Geçersiz istek.');
      if (otoblog.mesgulMu()) return hata(ctx, 409, 'Şu an zaten bir işlem çalışıyor, bitince tekrar deneyin.');
      const is = y.endsWith('/uret') ? otoblog.yaziUret({ tur: 'elle' }) : otoblog.konuOner({ tur: 'elle' });
      is.catch((e) => strapi.log.error(`otoblog panel: ${e.message}`));
      return (ctx.body = { data: { baslatildi: true } });
    }
    if (m === 'POST' && y === '/otomatik-blog/onayla') return (ctx.body = { data: { onaylanan: await otoblog.onaylaBekleyenler() } });
    const km = y.match(/^\/otomatik-blog\/konu\/(\d+)$/);
    if (m === 'POST' && km) {
      const r = await otoblog.konuDurumu(Number(km[1]), String(ctx.request.body?.durum || ''));
      return r ? (ctx.body = { data: { id: r.id, durum: r.durum } }) : hata(ctx, 400, 'Konu güncellenemedi.');
    }
    const tm = y.match(/^\/telefon\/(me|\d+)$/);
    if (m === 'GET' && tm) return (ctx.body = { data: { telefon: await telefonGetir(tm[1] === 'me' ? k.userId : Number(tm[1])) } });
    if (m === 'POST' && tm) {
      const id = tm[1] === 'me' ? k.userId : Number(tm[1]);
      if (!(await strapi.db.query('admin::user').findOne({ where: { id }, select: ['id'] }))) return hata(ctx, 404, 'Kullanıcı bulunamadı.');
      await telefonYaz(id, ctx.request.body?.telefon);
      return (ctx.body = { data: { telefon: await telefonGetir(id) } });
    }
    return hata(ctx, 404, 'Bulunamadı.');
  } catch (e) {
    strapi.log.error(`panel: ${e.message}`);
    return hata(ctx, 500, 'İşlem yapılamadı.');
  }
};

module.exports = () => async (ctx, next) => {
  const yol = ctx.path;
  const m = ctx.method;
  if (yol.startsWith('/swb-panel/')) return panel(ctx);
  if (!yol.startsWith('/admin/users')) return next();

  if (m === 'POST' && yol === '/admin/users') {
    const t = telefonAyikla(ctx);
    await next();
    const id = ctx.status < 300 && ctx.body?.data?.id;
    if (id && t !== undefined) await telefonYaz(id, t).catch(() => {});
    if (id) await telefonEkle(ctx.body.data).catch(() => {});
    return;
  }
  const bir = yol.match(/^\/admin\/users\/(\d+|me)$/);
  if (bir && m === 'PUT') {
    const t = telefonAyikla(ctx);
    const kim = bir[1] === 'me' ? (await s.tokenKullanici(ctx))?.userId : Number(bir[1]);
    await next();
    if (kim && ctx.status < 300 && t !== undefined) await telefonYaz(kim, t).catch(() => {});
    if (ctx.status < 300) await telefonEkle(ctx.body?.data).catch(() => {});
    return;
  }
  await next();
  if (m === 'GET' && ctx.status < 300 && ctx.body?.data) {
    const d = ctx.body.data;
    await telefonEkle(Array.isArray(d.results) ? d.results : d).catch(() => {});
  }
};
