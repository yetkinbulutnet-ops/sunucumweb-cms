'use strict';

const { tablolariKur } = require('./guvenlik/servis');
const sablon = require('./guvenlik/sablon');
const { oranlariGuncelle } = require('./yardimci/oran');
const { tokenUret, ozetGuncelle } = require('./yardimci/abone');

const BLOG = 'api::blog-yazisi.blog-yazisi';

const indexNowBildir = async (yollar) => {
  const hedef = process.env.SITE_INTERNAL_URL;
  const token = process.env.SITE_INDEXNOW_TOKEN;
  if (!hedef || !token) return;
  try {
    const site = (process.env.SITE_PUBLIC_URL || 'https://sunucumweb.com').replace(/\/+$/, '');
    const r = await fetch(`${hedef.replace(/\/+$/, '')}/api/indexnow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-token': token },
      body: JSON.stringify({ urls: yollar.map((y) => `${site}${y}`) }),
      signal: AbortSignal.timeout(15000),
    });
    strapi.log.info(`indexnow: ${r.status} ${yollar.join(' ')}`);
  } catch (e) {
    strapi.log.warn(`indexnow: gonderilemedi (${e.message})`);
  }
};

const YENILEYEN_EYLEMLER = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft']);
let yenilemeZamanlayici = null;

const siteyiYenile = () => {
  clearTimeout(yenilemeZamanlayici);
  yenilemeZamanlayici = setTimeout(async () => {
    const hedef = process.env.SITE_INTERNAL_URL;
    const gizli = process.env.SITE_REVALIDATE_SECRET;
    if (!hedef || !gizli) return;
    try {
      const r = await fetch(`${hedef.replace(/\/+$/, '')}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': gizli },
        body: '{}',
        signal: AbortSignal.timeout(15000),
      });
      strapi.log.info(`site yenileme: ${r.status}`);
    } catch (e) {
      strapi.log.warn(`site yenileme: basarisiz (${e.message})`);
    }
  }, 1500);
};

const ODUL = 'api::cark-odulu.cark-odulu';
const KUPON = 'api::cark-kuponu.cark-kuponu';
const CARK_AYAR = 'api::cark-ayari.cark-ayari';
const ABONE = 'api::abone.abone';
const BULTEN_AYAR = 'api::bulten-ayari.bulten-ayari';
const SESSIZ = new Set(['api::cark-katilimi.cark-katilimi', KUPON, ABONE, 'api::iletisim-mesaji.iletisim-mesaji']);
const SISTEM_KLASORU = 'system-uploads';
let sistemKlasoru = null;

const sistemKlasoruHazirla = async () => {
  const q = strapi.db.query('plugin::upload.folder');
  sistemKlasoru = await q.findOne({ where: { name: SISTEM_KLASORU, parent: null } });
  if (!sistemKlasoru) sistemKlasoru = await strapi.plugin('upload').service('folder').create({ name: SISTEM_KLASORU, parent: null });
  return sistemKlasoru;
};
const ORAN_TETIKLEYEN = new Set([ODUL, KUPON, CARK_AYAR]);

const kuponlariAktar = async (odulId, ham) => {
  if (!odulId || typeof ham !== 'string' || !ham.trim()) return;
  const kodlar = [...new Set(ham.split(/[\r\n,;]+/).map((k) => k.trim()).filter((k) => k && k.length <= 60))].slice(0, 5000);
  let eklenen = 0;
  for (const kod of kodlar) {
    const var_ = await strapi.db.query(KUPON).findOne({ where: { kod }, select: ['id'] });
    if (var_) continue;
    await strapi.documents(KUPON).create({ data: { kod, odul: odulId, kullanildi: false } });
    eklenen += 1;
  }
  await strapi.db.query(ODUL).updateMany({ where: { documentId: odulId }, data: { yeniKuponlar: null } });
  strapi.log.info(`cark: ${eklenen} kupon havuza eklendi`);
};

module.exports = {
  register({ strapi }) {
    strapi.customFields.register({ name: 'ikon', type: 'string' });
  },
  async bootstrap({ strapi }) {
    await tablolariKur();
    setTimeout(() => {
      oranlariGuncelle();
      ozetGuncelle();
    }, 3000);
    const eposta = strapi.plugin('email').service('email');
    const gonder = eposta.send.bind(eposta);
    eposta.send = (secenek = {}) => {
      if (/test mail/i.test(String(secenek.subject || ''))) {
        const p = sablon.smtpTest({ alici: secenek.to });
        return gonder({ ...secenek, subject: p.subject, text: p.text, html: p.html });
      }
      return gonder(secenek);
    };

    await sistemKlasoruHazirla().catch((e) => strapi.log.warn(`medya klasoru: ${e.message}`));
    strapi.db.lifecycles.subscribe({
      models: ['plugin::upload.file'],
      beforeCreate(event) {
        const d = event.params.data || {};
        if (sistemKlasoru && !d.folder && (!d.folderPath || d.folderPath === '/')) {
          d.folder = sistemKlasoru.id;
          d.folderPath = sistemKlasoru.path;
        }
      },
      afterUpdate: siteyiYenile,
      afterDelete: siteyiYenile,
    });

    strapi.documents.use(async (ctx, next) => {
      if (ctx.uid === ABONE && (ctx.action === 'create' || ctx.action === 'update') && ctx.params?.data) {
        const d = ctx.params.data;
        if (typeof d.eposta === 'string') d.eposta = d.eposta.trim().toLocaleLowerCase('tr');
        if (ctx.action === 'create') {
          if (!d.token) d.token = tokenUret();
          if (!d.izinTarihi) d.izinTarihi = new Date();
          if (d.durum === 'aktif' && !d.onayYontemi) d.onayYontemi = 'panel';
          if (d.durum === 'aktif' && !d.onayTarihi) d.onayTarihi = new Date();
        }
      }
      const sonuc = await next();
      if (ORAN_TETIKLEYEN.has(ctx.uid) && YENILEYEN_EYLEMLER.has(ctx.action)) oranlariGuncelle();
      if ((ctx.uid === ABONE || ctx.uid === BULTEN_AYAR) && YENILEYEN_EYLEMLER.has(ctx.action)) ozetGuncelle();
      if (ctx.uid === ODUL && (ctx.action === 'create' || ctx.action === 'update')) {
        await kuponlariAktar(sonuc?.documentId || ctx.params?.documentId, ctx.params?.data?.yeniKuponlar);
      }
      if (String(ctx.uid).startsWith('api::') && !SESSIZ.has(ctx.uid) && YENILEYEN_EYLEMLER.has(ctx.action)) siteyiYenile();
      if (ctx.uid === BLOG && ctx.action === 'publish' && ctx.params?.documentId) {
        const y = await strapi.documents(BLOG).findOne({ documentId: ctx.params.documentId, fields: ['slug'], status: 'published' });
        if (y?.slug) setTimeout(() => indexNowBildir([`/blog/${y.slug}`, '/blog']), 20000);
      }
      return sonuc;
    });
  },
};
