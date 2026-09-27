'use strict';

const crypto = require('crypto');
const sablon = require('../../../guvenlik/sablon');
const { aboneKaydet } = require('../../../yardimci/abone');

const AYAR = 'api::cark-ayari.cark-ayari';
const ODUL = 'api::cark-odulu.cark-odulu';
const KUPON = 'api::cark-kuponu.cark-kuponu';
const KATILIM = 'api::cark-katilimi.cark-katilimi';
const EPOSTA_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

let kuyruk = Promise.resolve();
const sirayla = (is) => {
  const sonuc = kuyruk.then(is, is);
  kuyruk = sonuc.catch(() => {});
  return sonuc;
};

const esit = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
};

const agirlikliSec = (liste) => {
  const toplam = liste.reduce((t, o) => t + o.agirlik, 0);
  let r = crypto.randomInt(0, toplam);
  for (const o of liste) {
    if (r < o.agirlik) return o;
    r -= o.agirlik;
  }
  return liste[liste.length - 1];
};

const hata = (ctx, status, message, kod) => {
  ctx.status = status;
  ctx.body = { data: null, error: { status, kod, message } };
};

module.exports = {
  async cevir(ctx) {
    if (!esit(ctx.request.headers['x-cark-secret'], process.env.SITE_CARK_SECRET)) return hata(ctx, 401, 'Yetkisiz', 'yetkisiz');
    const b = ctx.request.body || {};
    const eposta = String(b.eposta || '').trim().toLocaleLowerCase('tr');
    const ip = String(b.ip || '').slice(0, 64);
    if (!EPOSTA_RE.test(eposta) || eposta.length > 254) return hata(ctx, 400, 'Geçerli bir e-posta adresi girin.', 'eposta_gecersiz');
    if (b.kvkk !== true) return hata(ctx, 400, 'Devam etmek için aydınlatma metnini onaylayın.', 'kvkk');

    const sonuc = await sirayla(async () => {
      const ayar = await strapi.documents(AYAR).findFirst();
      if (!ayar?.aktif) return { hata: [403, 'Çark şu anda aktif değil.', 'kapali'] };

      const onceki = await strapi.documents(KATILIM).findMany({ filters: { eposta, donem: ayar.donem }, fields: ['kupon'], limit: 50 });
      if (onceki.some((k) => k.kupon)) return { hata: [409, 'Bu e-posta adresiyle bu dönem çark zaten çevrildi. Kazandığın kupon e-postanda.', 'zaten_kazandi'] };
      const hak = 1 + Math.max(0, Math.min(10, ayar.pasTekrarHakki ?? 0));
      if (onceki.length >= hak) return { hata: [409, 'Bu e-posta adresiyle bu dönemki çevirme hakların doldu.', 'hak_bitti'] };

      if (ip) {
        const gun = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const ipSayisi = await strapi.documents(KATILIM).count({ filters: { ip, createdAt: { $gt: gun } } });
        if (ipSayisi >= (ayar.ipGunlukLimit || 5)) return { hata: [429, 'Bu bağlantıdan bugün çok fazla katılım oldu. Lütfen yarın tekrar deneyin.', 'ip_limit'] };
      }

      const oduller = await strapi.documents(ODUL).findMany({ filters: { aktif: true }, sort: 'sira:asc', limit: 50 });
      const adaylar = [];
      for (const o of oduller) {
        if (!(o.agirlik > 0)) continue;
        if (o.kazanamaz) {
          adaylar.push(o);
          continue;
        }
        const kalan = await strapi.documents(KUPON).count({ filters: { odul: { documentId: o.documentId }, kullanildi: false } });
        if (kalan > 0) adaylar.push(o);
      }
      if (!adaylar.length) return { hata: [410, 'Şu anda dağıtılacak ödül kalmadı. Yakında yeniden deneyin.', 'odul_kalmadi'] };

      const secilen = agirlikliSec(adaylar);
      let kod = null;
      if (!secilen.kazanamaz) {
        const kupon = await strapi.documents(KUPON).findFirst({ filters: { odul: { documentId: secilen.documentId }, kullanildi: false }, sort: 'id:asc' });
        if (!kupon) return { hata: [410, 'Şu anda dağıtılacak ödül kalmadı. Yakında yeniden deneyin.', 'odul_kalmadi'] };
        await strapi.documents(KUPON).update({ documentId: kupon.documentId, data: { kullanildi: true, verilenEposta: eposta, verilmeTarihi: new Date() } });
        kod = kupon.kod;
      }

      await strapi.documents(KATILIM).create({
        data: {
          eposta,
          donem: ayar.donem,
          odul: secilen.documentId,
          odulAdi: secilen.ad,
          kupon: kod,
          ip,
          kvkkOnay: true,
          pazarlamaOnay: b.pazarlama === true,
        },
      });

      const kalanHak = secilen.kazanamaz ? Math.max(0, hak - onceki.length - 1) : 0;
      return { secilen, kod, kalanHak };
    });

    if (sonuc.hata) return hata(ctx, sonuc.hata[0], sonuc.hata[1], sonuc.hata[2]);
    const { secilen, kod, kalanHak } = sonuc;

    if (b.pazarlama === true) {
      aboneKaydet({ eposta, kaynak: 'cark', izinMetni: String(b.izinMetni || '').slice(0, 1000), ip, tarayici: b.tarayici, tekAdim: true }).catch((e) => strapi.log.error(`cark: abone kaydi yapilamadi (${e.message})`));
    }

    if (kod) {
      const p = sablon.carkKuponu({ odul: secilen.ad, aciklama: secilen.aciklama, kupon: kod, gecerlilik: secilen.gecerlilik, baglanti: secilen.baglanti });
      strapi
        .plugin('email')
        .service('email')
        .send({ to: eposta, from: process.env.MAIL_FROM_MUSTERI || 'SunucumWEB <sunucumweb@yetkinbulut.net>', subject: p.subject, html: p.html, text: p.text })
        .catch((e) => strapi.log.error(`cark: kupon e-postasi gonderilemedi (${e.message})`));
    }

    ctx.body = {
      data: {
        odul: secilen.documentId,
        ad: secilen.ad,
        aciklama: secilen.aciklama || '',
        kazanamaz: !!secilen.kazanamaz,
        kupon: kod,
        gecerlilik: secilen.gecerlilik || '',
        baglanti: secilen.baglanti || '',
        kalanHak,
      },
    };
  },
};
