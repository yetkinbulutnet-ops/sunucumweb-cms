'use strict';

const crypto = require('crypto');
const { mesajKaydet } = require('../../../yardimci/mesaj');

const esit = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
};

const EPOSTA_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const kes = (d, n) => String(d ?? '').trim().slice(0, n);

module.exports = {
  async yeni(ctx) {
    if (!esit(ctx.request.headers['x-cark-secret'], process.env.SITE_CARK_SECRET)) {
      ctx.status = 401;
      ctx.body = { data: null, error: { status: 401, kod: 'yetkisiz' } };
      return;
    }
    const b = ctx.request.body || {};
    const veri = {
      ad: kes(b.ad, 120),
      eposta: kes(b.eposta, 160).toLowerCase(),
      telefon: kes(b.telefon, 30),
      konu: kes(b.konu, 40),
      konuAdi: kes(b.konuAdi, 80),
      mesaj: kes(b.mesaj, 4000),
      ip: kes(b.ip, 64),
      tarayici: kes(b.tarayici, 300),
    };
    if (!veri.ad || !EPOSTA_RE.test(veri.eposta) || veri.mesaj.length < 5) {
      ctx.status = 400;
      ctx.body = { data: null, error: { status: 400, kod: 'gecersiz' } };
      return;
    }
    const m = await mesajKaydet(veri);
    ctx.body = { data: { id: m.id } };
  },
};
