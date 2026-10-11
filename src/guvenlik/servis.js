'use strict';

const crypto = require('crypto');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const sablon = require('./sablon');

const CIHAZ_CEREZ = 'swb_cihaz';
const KOD_DAKIKA = 10;
const MAKS_DENEME = 8;
const MAKS_GONDERIM = 5;
const YENIDEN_GONDER_SN = 60;

const gizli = () => process.env.GUVENLIK_SECRET || '';
const hmac = (v) => crypto.createHmac('sha256', gizli()).update(String(v)).digest('hex');
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const esit = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const db = () => strapi.db.connection;

const tabloVar = async (ad) => {
  const [satirlar] = await db().raw('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', [ad]);
  return Number(satirlar[0].n) > 0;
};

const tablolariKur = async () => {
  const s = db().schema;
  if (!(await tabloVar('swb_cihaz'))) {
    await s.createTable('swb_cihaz', (t) => {
      t.integer('user_id').unsigned().primary();
      t.string('cihaz_hash', 64).notNullable();
      t.string('ozet', 255);
      t.datetime('kayit_tarihi');
      t.datetime('son_gorulme');
    });
  }
  if (!(await tabloVar('swb_oturum'))) {
    await s.createTable('swb_oturum', (t) => {
      t.increments('id');
      t.integer('user_id').unsigned().notNullable().index();
      t.string('device_id', 64).index();
      t.string('cihaz_hash', 64).index();
      t.string('ip', 64);
      t.string('tarayici', 120);
      t.string('isletim', 120);
      t.string('tur', 40);
      t.string('konum', 160);
      t.string('dogrulama', 20);
      t.boolean('beni_hatirla').defaultTo(false);
      t.datetime('giris');
      t.datetime('son_aktif');
      t.datetime('bitis');
      t.string('bitis_nedeni', 40);
      t.boolean('bildirildi').defaultTo(false);
    });
  }
  if (!(await tabloVar('swb_telefon'))) {
    await s.createTable('swb_telefon', (t) => {
      t.integer('user_id').unsigned().primary();
      t.string('telefon', 32);
      t.datetime('guncelleme');
    });
  }
  if (!(await tabloVar('swb_dogrulama'))) {
    await s.createTable('swb_dogrulama', (t) => {
      t.string('id', 64).primary();
      t.integer('user_id').unsigned().notNullable().index();
      t.string('kod_hash', 64).notNullable();
      t.string('device_id', 64);
      t.boolean('beni_hatirla').defaultTo(false);
      t.string('ip', 64);
      t.string('ua', 512);
      t.integer('deneme').defaultTo(0);
      t.integer('gonderim').defaultTo(1);
      t.datetime('son_gonderim');
      t.datetime('bitis');
    });
  }
};

const ipAl = (ctx) => {
  const h = ctx.request.headers;
  const ip = h['x-real-ip'] || ctx.request.ip || '';
  return String(ip).replace(/^::ffff:/, '').slice(0, 64);
};

const konumAl = (ip) => {
  const g = geoip.lookup(ip);
  if (!g) return 'Bilinmiyor';
  let ulke = g.country;
  try {
    ulke = new Intl.DisplayNames(['tr'], { type: 'region' }).of(g.country) || g.country;
  } catch {}
  return [g.city, ulke].filter(Boolean).join(', ');
};

const cihazCoz = (ua) => {
  const r = new UAParser(String(ua || '')).getResult();
  const tarayici = [r.browser.name, r.browser.major].filter(Boolean).join(' ') || 'Bilinmeyen tarayıcı';
  const isletim = [r.os.name, r.os.version].filter(Boolean).join(' ') || 'Bilinmeyen sistem';
  const tur = r.device.type === 'mobile' ? 'Telefon' : r.device.type === 'tablet' ? 'Tablet' : 'Bilgisayar';
  return { tarayici: tarayici.slice(0, 120), isletim: isletim.slice(0, 120), tur };
};

const cihazOzeti = (c) => `${c.tarayici}, ${c.isletim}`;

const tarihYaz = (d) =>
  d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' }) : '';

const cerezAyar = (ctx, maxAge) => ({
  httpOnly: true,
  secure: ctx.request.secure,
  sameSite: 'strict',
  path: '/',
  overwrite: true,
  maxAge,
});

const cihazCereziOku = (ctx) => {
  const v = ctx.cookies.get(CIHAZ_CEREZ);
  if (!v || !v.includes('.')) return null;
  const [id, imza] = v.split('.');
  if (!/^[a-f0-9]{48}$/.test(id) || !esit(imza, hmac(`cihaz:${id}`))) return null;
  return sha(id);
};

const cihazCereziYaz = (ctx) => {
  const id = crypto.randomBytes(24).toString('hex');
  ctx.cookies.set(CIHAZ_CEREZ, `${id}.${hmac(`cihaz:${id}`)}`, cerezAyar(ctx, 400 * 24 * 60 * 60 * 1000));
  return sha(id);
};

const kayitliCihaz = (userId) => db()('swb_cihaz').where({ user_id: userId }).first();

const cihazKaydet = async (userId, cihazHash, ozet) => {
  const simdi = new Date();
  const var_ = await kayitliCihaz(userId);
  if (var_) await db()('swb_cihaz').where({ user_id: userId }).update({ cihaz_hash: cihazHash, ozet, kayit_tarihi: simdi, son_gorulme: simdi });
  else await db()('swb_cihaz').insert({ user_id: userId, cihaz_hash: cihazHash, ozet, kayit_tarihi: simdi, son_gorulme: simdi });
  return var_;
};

const epostaGonder = async (to, p) => {
  try {
    await strapi.plugin('email').service('email').send({ to, subject: p.subject, html: p.html, text: p.text });
    return true;
  } catch (e) {
    strapi.log.error(`guvenlik: e-posta gonderilemedi (${e.message})`);
    return false;
  }
};

const maskele = (email) => {
  const [a, d] = String(email).split('@');
  if (!d) return email;
  return `${a.slice(0, 2)}${'*'.repeat(Math.max(1, a.length - 2))}@${d}`;
};

const aktifDigerOturum = async (userId, haricDevice) => {
  const aktifler = await strapi.sessionManager('admin').listSessions(String(userId));
  const cihazlar = new Set(aktifler.map((s) => s.deviceId).filter((d) => d && d !== haricDevice));
  if (!cihazlar.size) return null;
  const o = await db()('swb_oturum').where({ user_id: userId }).whereIn('device_id', [...cihazlar]).whereNull('bitis').orderBy('son_aktif', 'desc').first();
  return o ? `${o.tarayici}, ${o.isletim}, ${o.konum}` : true;
};

const kodOlustur = async ({ user, deviceId, beniHatirla, ctx }) => {
  await db()('swb_dogrulama').where('bitis', '<', new Date()).del();
  await db()('swb_dogrulama').where({ user_id: user.id }).del();
  const id = crypto.randomBytes(24).toString('hex');
  const kod = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const simdi = new Date();
  await db()('swb_dogrulama').insert({
    id,
    user_id: user.id,
    kod_hash: hmac(`kod:${id}:${kod}`),
    device_id: deviceId,
    beni_hatirla: !!beniHatirla,
    ip: ipAl(ctx),
    ua: String(ctx.request.headers['user-agent'] || '').slice(0, 512),
    deneme: 0,
    gonderim: 1,
    son_gonderim: simdi,
    bitis: new Date(simdi.getTime() + KOD_DAKIKA * 60000),
  });
  return { id, kod };
};

const kodEpostasi = async (user, kod, ctx, digerCihaz) => {
  const ip = ipAl(ctx);
  const c = cihazCoz(ctx.request.headers['user-agent']);
  return epostaGonder(
    user.email,
    sablon.dogrulamaKodu({
      ad: user.firstname || user.email,
      kod,
      dakika: KOD_DAKIKA,
      digerCihaz,
      oturum: { tarih: tarihYaz(new Date()), cihaz: cihazOzeti(c), ip, konum: konumAl(ip) },
    })
  );
};

const kodYenile = async (id, ctx) => {
  const d = await db()('swb_dogrulama').where({ id }).first();
  if (!d || new Date(d.bitis) < new Date()) return { hata: 'Doğrulama süresi doldu. Lütfen tekrar giriş yapın.' };
  const gecen = (Date.now() - new Date(d.son_gonderim).getTime()) / 1000;
  if (gecen < YENIDEN_GONDER_SN) return { hata: `Yeni kod için ${Math.ceil(YENIDEN_GONDER_SN - gecen)} saniye bekleyin.` };
  if (d.gonderim >= MAKS_GONDERIM) return { hata: 'Çok fazla kod istendi. Lütfen tekrar giriş yapın.' };
  const user = await strapi.db.query('admin::user').findOne({ where: { id: d.user_id } });
  if (!user) return { hata: 'Doğrulama geçersiz.' };
  const kod = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const simdi = new Date();
  await db()('swb_dogrulama').where({ id }).update({
    kod_hash: hmac(`kod:${id}:${kod}`),
    gonderim: d.gonderim + 1,
    son_gonderim: simdi,
    bitis: new Date(simdi.getTime() + KOD_DAKIKA * 60000),
  });
  await kodEpostasi(user, kod, ctx, await aktifDigerOturum(user.id, d.device_id));
  return { tamam: true };
};

const kodDogrula = async (id, kod) => {
  const d = await db()('swb_dogrulama').where({ id }).first();
  if (!d || new Date(d.bitis) < new Date()) return { hata: 'Doğrulama süresi doldu. Lütfen tekrar giriş yapın.', bitti: true };
  const hak = await db()('swb_dogrulama').where({ id }).andWhere('deneme', '<', MAKS_DENEME).increment('deneme', 1);
  if (!hak) {
    await db()('swb_dogrulama').where({ id }).del();
    return { hata: 'Çok fazla hatalı deneme. Lütfen tekrar giriş yapın.', bitti: true };
  }
  if (/^\d{6}$/.test(String(kod)) && esit(d.kod_hash, hmac(`kod:${id}:${kod}`))) {
    const silinen = await db()('swb_dogrulama').where({ id }).del();
    if (!silinen) return { hata: 'Doğrulama süresi doldu. Lütfen tekrar giriş yapın.', bitti: true };
    return { kayit: d };
  }
  const guncel = await db()('swb_dogrulama').where({ id }).first();
  const kalan = MAKS_DENEME - (guncel ? guncel.deneme : MAKS_DENEME);
  if (kalan <= 0) {
    await db()('swb_dogrulama').where({ id }).del();
    return { hata: 'Çok fazla hatalı deneme. Lütfen tekrar giriş yapın.', bitti: true };
  }
  return { hata: `Kod hatalı. ${kalan} deneme hakkınız kaldı.` };
};

const oturumBaslat = async ({ userId, deviceId, cihazHash, ctx, dogrulama, beniHatirla }) => {
  const ip = ipAl(ctx);
  const c = cihazCoz(ctx.request.headers['user-agent']);
  const simdi = new Date();
  await db()('swb_oturum').where({ user_id: userId, device_id: deviceId }).whereNull('bitis').update({ bitis: simdi, bitis_nedeni: 'yeniden-giris' });
  await db()('swb_oturum').insert({
    user_id: userId,
    device_id: deviceId,
    cihaz_hash: cihazHash,
    ip,
    tarayici: c.tarayici,
    isletim: c.isletim,
    tur: c.tur,
    konum: konumAl(ip),
    dogrulama,
    beni_hatirla: !!beniHatirla,
    giris: simdi,
    son_aktif: simdi,
  });
  return { ip, cihaz: c };
};

const digerleriniKapat = async (userId, deviceId, neden) => {
  const sm = strapi.sessionManager('admin');
  const aktifler = await sm.listSessions(String(userId));
  const cihazlar = [...new Set(aktifler.map((s) => s.deviceId).filter((d) => d && d !== deviceId))];
  for (const d of cihazlar) await sm.invalidateRefreshToken(String(userId), d);
  await db()('swb_oturum').where({ user_id: userId }).whereNot({ device_id: deviceId }).whereNull('bitis').update({ bitis: new Date(), bitis_nedeni: neden });
  return cihazlar.length;
};

const sonAktifIzle = new Map();
const oturumCihazi = new Map();

const aktiflikIsle = async (token) => {
  const r = strapi.sessionManager('admin').validateAccessToken(token);
  if (!r.isValid || !r.payload?.sessionId) return;
  const { sessionId } = r.payload;
  const simdi = Date.now();
  if ((sonAktifIzle.get(sessionId) || 0) > simdi - 60000) return;
  sonAktifIzle.set(sessionId, simdi);
  if (sonAktifIzle.size > 5000) sonAktifIzle.clear();
  let deviceId = oturumCihazi.get(sessionId);
  if (!deviceId) {
    const s = await strapi.db.query('admin::session').findOne({ where: { sessionId } });
    if (!s) return;
    deviceId = s.deviceId;
    oturumCihazi.set(sessionId, deviceId);
    if (oturumCihazi.size > 5000) oturumCihazi.clear();
  }
  await db()('swb_oturum').where({ user_id: Number(r.payload.userId), device_id: deviceId }).whereNull('bitis').update({ son_aktif: new Date(simdi) });
};

const tokenKullanici = async (ctx) => {
  const h = ctx.request.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const sm = strapi.sessionManager('admin');
  const r = sm.validateAccessToken(m[1]);
  if (!r.isValid || !r.payload?.sessionId) return null;
  if (!(await sm.isSessionActive(r.payload.sessionId))) return null;
  const s = await strapi.db.query('admin::session').findOne({ where: { sessionId: r.payload.sessionId } });
  return { userId: Number(r.payload.userId), deviceId: s?.deviceId || null };
};

const NEDEN = {
  'yeni-cihaz': 'Başka cihazdan giriş yapıldı',
  'yeni-oturum': 'Yeni oturum açıldı',
  'yeniden-giris': 'Aynı cihazda yeniden giriş',
  cikis: 'Çıkış yapıldı',
  'sifre-degisti': 'Şifre değiştirildi',
  sure: 'Süresi doldu',
};

const oturumListesi = async (userId, deviceId) => {
  const aktifler = await strapi.sessionManager('admin').listSessions(String(userId));
  const aktifCihazlar = new Set(aktifler.map((s) => s.deviceId));
  const satirlar = await db()('swb_oturum').where({ user_id: userId }).orderBy('giris', 'desc').limit(3);
  const cihaz = await kayitliCihaz(userId);
  return {
    kayitliCihaz: cihaz ? { ozet: cihaz.ozet, kayit: cihaz.kayit_tarihi } : null,
    oturumlar: satirlar.map((o) => {
      const acik = !o.bitis && aktifCihazlar.has(o.device_id);
      return {
        buCihaz: o.device_id === deviceId && acik,
        durum: acik ? 'aktif' : 'kapali',
        neden: o.bitis ? NEDEN[o.bitis_nedeni] || o.bitis_nedeni : acik ? null : NEDEN.sure,
        tarayici: o.tarayici,
        isletim: o.isletim,
        tur: o.tur,
        ip: o.ip,
        konum: o.konum,
        dogrulama: o.dogrulama === '2fa' ? 'E-posta doğrulaması' : 'Kayıtlı cihaz',
        beniHatirla: !!o.beni_hatirla,
        giris: o.giris,
        sonAktif: o.son_aktif,
        bitis: o.bitis,
      };
    }),
  };
};

const cihazBildirimi = async (ctx) => {
  const h = cihazCereziOku(ctx);
  if (!h) return null;
  const o = await db()('swb_oturum')
    .where({ cihaz_hash: h, bitis_nedeni: 'yeni-cihaz', bildirildi: false })
    .where('bitis', '>', new Date(Date.now() - 7 * 24 * 3600 * 1000))
    .orderBy('bitis', 'desc')
    .first();
  if (!o) return null;
  await db()('swb_oturum').where({ cihaz_hash: h, bitis_nedeni: 'yeni-cihaz' }).update({ bildirildi: true });
  const yeni = await db()('swb_oturum').where({ user_id: o.user_id }).whereNot({ cihaz_hash: h }).orderBy('giris', 'desc').first();
  return {
    zaman: o.bitis,
    yeniCihaz: yeni ? `${yeni.tarayici}, ${yeni.isletim}` : null,
    yeniKonum: yeni ? yeni.konum : null,
  };
};

module.exports = {
  CIHAZ_CEREZ,
  KOD_DAKIKA,
  YENIDEN_GONDER_SN,
  tablolariKur,
  ipAl,
  konumAl,
  cihazCoz,
  cihazOzeti,
  tarihYaz,
  cihazCereziOku,
  cihazCereziYaz,
  kayitliCihaz,
  cihazKaydet,
  epostaGonder,
  maskele,
  aktifDigerOturum,
  kodOlustur,
  kodEpostasi,
  kodYenile,
  kodDogrula,
  oturumBaslat,
  digerleriniKapat,
  aktiflikIsle,
  tokenKullanici,
  oturumListesi,
  cihazBildirimi,
};
