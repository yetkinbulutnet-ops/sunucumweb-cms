'use strict';

const crypto = require('crypto');
const { aboneKaydet, islemYap } = require('../../../yardimci/abone');

const EPOSTA_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const ISLEMLER = new Set(['onay', 'iptal', 'tek-tik', 'bilgi']);

const esit = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
};

const hata = (ctx, status, kod) => {
  ctx.status = status;
  ctx.body = { data: null, error: { status, kod, message: kod } };
};

module.exports = {
  async kayit(ctx) {
    if (!esit(ctx.request.headers['x-cark-secret'], process.env.SITE_CARK_SECRET)) return hata(ctx, 401, 'yetkisiz');
    const b = ctx.request.body || {};
    const eposta = String(b.eposta || '').trim().toLocaleLowerCase('tr');
    if (!EPOSTA_RE.test(eposta) || eposta.length > 254) return hata(ctx, 400, 'eposta_gecersiz');
    if (b.izin !== true) return hata(ctx, 400, 'izin');
    const s = await aboneKaydet({ eposta, kaynak: String(b.kaynak || ''), izinMetni: b.izinMetni, ip: String(b.ip || '').slice(0, 64), tarayici: b.tarayici });
    if (s.hata) return hata(ctx, s.hata[0], s.hata[1]);
    ctx.body = { data: { durum: s.durum } };
  },

  async islem(ctx) {
    if (!esit(ctx.request.headers['x-cark-secret'], process.env.SITE_CARK_SECRET)) return hata(ctx, 401, 'yetkisiz');
    const b = ctx.request.body || {};
    if (!ISLEMLER.has(b.islem)) return hata(ctx, 400, 'gecersiz_istek');
    const s = await islemYap({ token: b.token, islem: b.islem, ip: String(b.ip || '').slice(0, 64) });
    if (s.hata) return hata(ctx, s.hata[0], s.hata[1]);
    ctx.body = { data: s };
  },
};
