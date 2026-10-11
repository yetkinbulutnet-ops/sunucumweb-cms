'use strict';

const path = require('path');
const crypto = require('crypto');
const { buildSessionMetadata } = require('@strapi/utils');
const s = require('../guvenlik/servis');
const sablon = require('../guvenlik/sablon');

const oturumYardimci = () => require(path.join(process.cwd(), 'node_modules/@strapi/admin/dist/server/shared/utils/session-auth.js'));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const limitler = new Map();
const limitAsildi = (anahtar, adet, pencereMs) => {
  const simdi = Date.now();
  const liste = (limitler.get(anahtar) || []).filter((t) => t > simdi - pencereMs);
  liste.push(simdi);
  limitler.delete(anahtar);
  limitler.set(anahtar, liste);
  while (limitler.size > 10000) limitler.delete(limitler.keys().next().value);
  return liste.length > adet;
};

const hata = (ctx, status, message, details = {}, name = 'ApplicationError') => {
  ctx.status = status;
  ctx.body = { data: null, error: { status, name, message, details } };
};

const captchaDogrula = async (token, ip) => {
  if (!token || typeof token !== 'string' || token.length > 4000) return false;
  try {
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET || '', response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    return j.success === true;
  } catch (e) {
    strapi.log.error(`guvenlik: reCAPTCHA dogrulanamadi (${e.message})`);
    return false;
  }
};

const sanitize = (user) => strapi.service('admin::user').sanitizeUser(user);

const girisIsle = async (ctx, next) => {
  const b = ctx.request.body || {};
  const ip = s.ipAl(ctx);
  if (limitAsildi(`giris:${ip}`, 20, 10 * 60000)) return hata(ctx, 429, 'Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.');
  const captcha = b.captcha;
  delete b.captcha;
  if (!(await captchaDogrula(captcha, ip))) return hata(ctx, 400, 'Lütfen "Ben robot değilim" doğrulamasını tamamlayın.', { alan: 'captcha' }, 'SwbCaptcha');
  if (!b.deviceId || !UUID.test(String(b.deviceId))) b.deviceId = crypto.randomUUID();

  const [, user] = await strapi.service('admin::auth').checkCredentials({ email: b.email, password: b.password });
  if (!user) return next();

  const cihazHash = s.cihazCereziOku(ctx);
  const kayit = await s.kayitliCihaz(user.id);
  if (cihazHash && kayit && kayit.cihaz_hash === cihazHash) {
    await next();
    if (ctx.status === 200 && ctx.body?.data?.token) {
      await s.oturumBaslat({ userId: user.id, deviceId: b.deviceId, cihazHash, ctx, dogrulama: 'kayitli', beniHatirla: b.rememberMe });
      await s.digerleriniKapat(user.id, b.deviceId, 'yeni-oturum');
      await strapi.db.connection('swb_cihaz').where({ user_id: user.id }).update({ son_gorulme: new Date() });
    }
    return;
  }

  const digerCihaz = await s.aktifDigerOturum(user.id, b.deviceId);
  const { id, kod } = await s.kodOlustur({ user, deviceId: b.deviceId, beniHatirla: b.rememberMe, ctx });
  if (!(await s.kodEpostasi(user, kod, ctx, digerCihaz))) {
    return hata(ctx, 503, 'Doğrulama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin.');
  }
  return hata(
    ctx,
    401,
    'Girişi tamamlamak için e-postanıza gönderilen doğrulama kodunu girin.',
    {
      kimlik: id,
      eposta: s.maskele(user.email),
      digerCihaz,
      sure: s.KOD_DAKIKA * 60,
      yenidenGonder: s.YENIDEN_GONDER_SN,
    },
    'SwbIkiAdim'
  );
};

const unuttum = async (ctx, next) => {
  const b = ctx.request.body || {};
  const ip = s.ipAl(ctx);
  if (limitAsildi(`unuttum:${ip}`, 10, 10 * 60000)) return hata(ctx, 429, 'Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin.');
  const captcha = b.captcha;
  delete b.captcha;
  if (!(await captchaDogrula(captcha, ip))) return hata(ctx, 400, 'Lütfen "Ben robot değilim" doğrulamasını tamamlayın.', { alan: 'captcha' }, 'SwbCaptcha');
  return next();
};

const dogrula = async (ctx) => {
  const ip = s.ipAl(ctx);
  if (limitAsildi(`dogrula:${ip}`, 30, 10 * 60000)) return hata(ctx, 429, 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.');
  const { kimlik, kod } = ctx.request.body || {};
  if (typeof kimlik !== 'string' || !/^[a-f0-9]{48}$/.test(kimlik)) return hata(ctx, 400, 'Doğrulama geçersiz. Lütfen tekrar giriş yapın.', { bitti: true });
  const r = await s.kodDogrula(kimlik, String(kod || '').trim());
  if (r.hata) return hata(ctx, 400, r.hata, { bitti: !!r.bitti });
  const d = r.kayit;
  const user = await strapi.db.query('admin::user').findOne({ where: { id: d.user_id }, populate: ['roles'] });
  if (!user || user.isActive !== true || user.blocked) return hata(ctx, 403, 'Bu hesapla giriş yapılamaz.', { bitti: true });

  const ya = oturumYardimci();
  const sm = strapi.sessionManager('admin');
  const tur = d.beni_hatirla ? 'refresh' : 'session';
  const { token: yenileme, absoluteExpiresAt } = await sm.generateRefreshToken(String(user.id), d.device_id, {
    type: tur,
    metadata: buildSessionMetadata({ userAgent: ctx.request.headers['user-agent'] }),
  });
  ctx.cookies.set(ya.REFRESH_COOKIE_NAME, yenileme, ya.buildCookieOptionsWithExpiry(tur, absoluteExpiresAt, ctx.request.secure));
  const erisim = await sm.generateAccessToken(yenileme);
  if ('error' in erisim) return hata(ctx, 500, 'Oturum başlatılamadı.');

  const cihazHash = s.cihazCereziYaz(ctx);
  const c = s.cihazCoz(ctx.request.headers['user-agent']);
  const eski = await s.cihazKaydet(user.id, cihazHash, s.cihazOzeti(c));
  await s.oturumBaslat({ userId: user.id, deviceId: d.device_id, cihazHash, ctx, dogrulama: '2fa', beniHatirla: d.beni_hatirla });
  await s.digerleriniKapat(user.id, d.device_id, 'yeni-cihaz');
  if (eski && eski.cihaz_hash !== cihazHash) {
    s.epostaGonder(
      user.email,
      sablon.yeniCihaz({
        ad: user.firstname || user.email,
        eskiCihaz: eski.ozet,
        oturum: { tarih: s.tarihYaz(new Date()), cihaz: s.cihazOzeti(c), ip, konum: s.konumAl(ip) },
      })
    );
  }
  strapi.eventHub.emit('admin.auth.success', { user: sanitize(user), provider: 'local' });
  ctx.status = 200;
  ctx.body = { data: { token: erisim.token, accessToken: erisim.token, user: sanitize(user) } };
};

const yenidenGonder = async (ctx) => {
  const ip = s.ipAl(ctx);
  if (limitAsildi(`yenile:${ip}`, 10, 10 * 60000)) return hata(ctx, 429, 'Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin.');
  const { kimlik } = ctx.request.body || {};
  if (typeof kimlik !== 'string' || !/^[a-f0-9]{48}$/.test(kimlik)) return hata(ctx, 400, 'Doğrulama geçersiz. Lütfen tekrar giriş yapın.', { bitti: true });
  const r = await s.kodYenile(kimlik, ctx);
  if (r.hata) return hata(ctx, 400, r.hata);
  ctx.status = 200;
  ctx.body = { data: { tamam: true } };
};

const tumOturumlariKapat = async (ctx, userId, neden) => {
  const ya = oturumYardimci();
  await strapi.sessionManager('admin').invalidateRefreshToken(String(userId));
  ctx.cookies.set(ya.REFRESH_COOKIE_NAME, '', { ...ya.getRefreshCookieOptions(ctx.request.secure), maxAge: 0, expires: new Date(0) });
  await strapi.db.connection('swb_oturum').where({ user_id: userId }).whereNull('bitis').update({ bitis: new Date(), bitis_nedeni: neden });
};

const sifreSonrasi = async (ctx, next, tur) => {
  await next();
  const token = ctx.status === 200 && ctx.body?.data?.token;
  if (!token) return;
  const r = strapi.sessionManager('admin').validateAccessToken(token);
  const userId = Number(r.payload?.userId || ctx.body.data.user?.id);
  if (!userId) return;
  await tumOturumlariKapat(ctx, userId, 'sifre-degisti');
  await strapi.db.connection('swb_cihaz').where({ user_id: userId }).del();
  if (tur === 'sifirla') {
    const user = await strapi.db.query('admin::user').findOne({ where: { id: userId } });
    const ip = s.ipAl(ctx);
    if (user) {
      s.epostaGonder(
        user.email,
        sablon.sifreDegisti({
          ad: user.firstname || user.email,
          oturum: { tarih: s.tarihYaz(new Date()), cihaz: s.cihazOzeti(s.cihazCoz(ctx.request.headers['user-agent'])), ip, konum: s.konumAl(ip) },
        })
      );
    }
  }
  ctx.status = 200;
  ctx.body = {
    data: {
      swbYonlendir: '/admin/auth/login',
      mesaj: tur === 'sifirla' ? 'Şifreniz güncellendi. Güvenliğiniz için yeni şifrenizle giriş yapın.' : 'Hesabınız oluşturuldu. Lütfen giriş yapın.',
    },
  };
};

const profilSifre = async (ctx, next) => {
  const govde = ctx.request.body || {};
  const sifreVar = !!govde.password;
  const k = sifreVar || govde.email !== undefined ? await s.tokenKullanici(ctx) : null;
  if (govde.email !== undefined) {
    if (!k) return hata(ctx, 401, 'Oturum geçersiz.');
    const mevcut = await strapi.db.query('admin::user').findOne({ where: { id: k.userId }, select: ['email'] });
    if (!mevcut || String(govde.email).trim().toLowerCase() !== String(mevcut.email).toLowerCase()) {
      return hata(ctx, 403, 'E-posta adresinizi değiştiremezsiniz. Bu işlemi yalnızca Süper Admin yapabilir.', { alan: 'email' });
    }
  }
  await next();
  if (!sifreVar) return;
  if (!k || ctx.status !== 200) return;
  await s.digerleriniKapat(k.userId, k.deviceId, 'sifre-degisti');
  const user = await strapi.db.query('admin::user').findOne({ where: { id: k.userId } });
  const ip = s.ipAl(ctx);
  if (user) {
    s.epostaGonder(
      user.email,
      sablon.sifreDegisti({
        ad: user.firstname || user.email,
        oturum: { tarih: s.tarihYaz(new Date()), cihaz: s.cihazOzeti(s.cihazCoz(ctx.request.headers['user-agent'])), ip, konum: s.konumAl(ip) },
      })
    );
  }
};

const kullaniciGuncelle = async (ctx, next, hedefId) => {
  const govde = ctx.request.body || {};
  const once = await strapi.db.query('admin::user').findOne({ where: { id: hedefId }, select: ['email'] });
  await next();
  if (ctx.status >= 300 || !once) return;
  const kritik =
    !!govde.password ||
    govde.isActive === false ||
    govde.blocked === true ||
    (govde.email !== undefined && String(govde.email).trim().toLowerCase() !== String(once.email).toLowerCase());
  if (!kritik) return;
  await strapi.sessionManager('admin').invalidateRefreshToken(String(hedefId));
  await strapi.db.connection('swb_oturum').where({ user_id: hedefId }).whereNull('bitis').update({ bitis: new Date(), bitis_nedeni: 'yonetici-degisikligi' });
  await strapi.db.connection('swb_cihaz').where({ user_id: hedefId }).del();
  await strapi.db.connection('swb_dogrulama').where({ user_id: hedefId }).del();
};

const cikis = async (ctx, next) => {
  const k = await s.tokenKullanici(ctx).catch(() => null);
  await next();
  if (k && k.deviceId && ctx.status < 400) {
    await strapi.db.connection('swb_oturum').where({ user_id: k.userId, device_id: k.deviceId }).whereNull('bitis').update({ bitis: new Date(), bitis_nedeni: 'cikis' });
  }
};

const ozel = async (ctx) => {
  const y = yolNormal(ctx.path).slice('/swb-guvenlik'.length);
  ctx.set('Cache-Control', 'no-store');
  if (ctx.method === 'GET' && y === '/durum') {
    ctx.body = { data: { siteAnahtari: process.env.RECAPTCHA_SITE_KEY || '', bildirim: await s.cihazBildirimi(ctx) } };
    return;
  }
  if (ctx.method === 'POST' && y === '/dogrula') return dogrula(ctx);
  if (ctx.method === 'POST' && y === '/yeniden-gonder') return yenidenGonder(ctx);
  if (ctx.method === 'GET' && y === '/oturumlar') {
    const k = await s.tokenKullanici(ctx);
    if (!k) return hata(ctx, 401, 'Oturum geçersiz.');
    ctx.body = { data: await s.oturumListesi(k.userId, k.deviceId) };
    return;
  }
  return hata(ctx, 404, 'Bulunamadı.');
};

const yolNormal = (ham) => {
  let y = String(ham || '');
  try {
    y = decodeURIComponent(y);
  } catch {}
  return y.toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
};

module.exports = () => async (ctx, next) => {
  const yol = yolNormal(ctx.path);
  const m = ctx.method;
  if (yol.startsWith('/swb-guvenlik/')) return ozel(ctx);
  if (m === 'POST' && yol === '/admin/login') return girisIsle(ctx, next);
  if (m === 'POST' && yol === '/admin/forgot-password') return unuttum(ctx, next);
  if (m === 'POST' && yol === '/admin/reset-password') return sifreSonrasi(ctx, next, 'sifirla');
  if (m === 'POST' && yol === '/admin/register') return sifreSonrasi(ctx, next, 'kayit');
  if (m === 'POST' && yol === '/admin/logout') return cikis(ctx, next);
  if (m === 'PUT' && yol === '/admin/users/me') return profilSifre(ctx, next);
  const kullaniciYolu = m === 'PUT' && yol.match(/^\/admin\/users\/(\d+)$/);
  if (kullaniciYolu) return kullaniciGuncelle(ctx, next, Number(kullaniciYolu[1]));
  const auth = ctx.request.headers.authorization;
  if (auth && auth.startsWith('Bearer ') && !yol.startsWith('/api/')) {
    s.aktiflikIsle(auth.slice(7)).catch(() => {});
  }
  return next();
};
