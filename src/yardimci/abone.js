'use strict';

const crypto = require('crypto');
const sablon = require('../guvenlik/sablon');
const { metinlerAl } = require('./metin');

const ABONE = 'api::abone.abone';
const AYAR = 'api::bulten-ayari.bulten-ayari';
const KAYNAKLAR = new Set(['footer', 'anasayfa', 'kampanyalar', 'blog', 'cark', 'iletisim', 'diger']);
const TEKRAR_DK = 10;
const EN_FAZLA_GONDERIM = 5;

const site = () => (process.env.SITE_PUBLIC_URL || 'https://sunucumweb.com').replace(/\/+$/, '');
const tokenUret = () => crypto.randomBytes(24).toString('base64url');
const baglantilar = (token) => ({
  onay: `${site()}/bulten?islem=onay&t=${token}`,
  iptal: `${site()}/bulten?islem=iptal&t=${token}`,
  tekTik: `${site()}/api/abone/cik?t=${token}`,
});

let kuyruk = Promise.resolve();
const sirayla = (is) => {
  const sonuc = kuyruk.then(is, is);
  kuyruk = sonuc.catch(() => {});
  return sonuc;
};

const onayGonder = async (abone) => {
  const t = await metinlerAl();
  const b = baglantilar(abone.token);
  const p = sablon.bultenOnay({ t, onayUrl: b.onay, iptalUrl: b.iptal });
  await strapi
    .plugin('email')
    .service('email')
    .send({
      to: abone.eposta,
      from: process.env.MAIL_FROM_MUSTERI || process.env.MAIL_FROM,
      subject: p.subject,
      html: p.html,
      text: p.text,
      headers: { 'List-Unsubscribe': `<${b.tekTik}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
};

const KAYNAK_ADI = { footer: 'Alt bilgi', anasayfa: 'Ana sayfa', kampanyalar: 'Kampanyalar', blog: 'Blog', cark: 'Çark', iletisim: 'İletişim', panel: 'Panel', diger: 'Diğer' };

const ozetHesapla = async () => {
  const q = strapi.db.query(ABONE);
  const [aktif, beklemede, iptal] = await Promise.all(['aktif', 'beklemede', 'iptal'].map((durum) => q.count({ where: { durum } })));
  const kaynaklar = [];
  for (const k of Object.keys(KAYNAK_ADI)) {
    const n = await q.count({ where: { durum: 'aktif', kaynak: k } });
    if (n) kaynaklar.push(`${KAYNAK_ADI[k]} ${n}`);
  }
  const ozet = [
    `Aktif abone: ${aktif} · Onay bekleyen: ${beklemede} · Ayrılan: ${iptal} · Toplam kayıt: ${aktif + beklemede + iptal}`,
    kaynaklar.length ? `Aktif abonelerin geldiği yer: ${kaynaklar.join(' · ')}` : '',
    `Son güncelleme: ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
  ].filter(Boolean).join('\n');
  const ayar = await strapi.db.query(AYAR).findOne({ select: ['id'] });
  if (ayar) await strapi.db.query(AYAR).update({ where: { id: ayar.id }, data: { ozet } });
};

let ozetZamanlayici = null;
const ozetGuncelle = () => {
  clearTimeout(ozetZamanlayici);
  ozetZamanlayici = setTimeout(() => ozetHesapla().catch((e) => strapi.log.warn(`bulten ozet: ${e.message}`)), 1000);
};

const aboneKaydet = ({ eposta, kaynak, izinMetni, ip, tarayici, tekAdim = false }) =>
  sirayla(async () => {
    const ayar = (await strapi.db.query(AYAR).findOne({})) || {};
    if (!tekAdim && !ayar.aktif) return { hata: [403, 'kapali'] };
    const k = KAYNAKLAR.has(kaynak) ? kaynak : 'diger';
    const simdi = new Date();
    const ciftOnay = !tekAdim && ayar.ciftOnay !== false;
    const izin = { izinMetni: String(izinMetni || '').slice(0, 1000), izinTarihi: simdi, izinIp: ip || null, tarayici: String(tarayici || '').slice(0, 300) || null };
    const aktifVeri = { durum: 'aktif', onayYontemi: 'tek-adim', onayTarihi: simdi, onayIp: ip || null, iptalTarihi: null, iptalYontemi: null };
    const q = strapi.db.query(ABONE);
    const mevcut = await q.findOne({ where: { eposta } });

    if (mevcut?.durum === 'aktif') {
      await q.update({ where: { id: mevcut.id }, data: { sonKaynak: k } });
      return { durum: 'aktif' };
    }

    let abone;
    if (!mevcut) {
      abone = await strapi.documents(ABONE).create({ data: { eposta, kaynak: k, sonKaynak: k, token: tokenUret(), ...izin, ...(ciftOnay ? { durum: 'beklemede' } : aktifVeri) } });
    } else {
      const gecenDk = mevcut.sonOnayGonderimi ? (simdi - new Date(mevcut.sonOnayGonderimi)) / 60000 : Infinity;
      const yeniDongu = mevcut.durum === 'iptal' || gecenDk > 24 * 60;
      if (ciftOnay && mevcut.durum === 'beklemede' && !yeniDongu && (gecenDk < TEKRAR_DK || (mevcut.onayGonderimi || 0) >= EN_FAZLA_GONDERIM)) {
        await q.update({ where: { id: mevcut.id }, data: { sonKaynak: k } });
        return { durum: 'beklemede' };
      }
      abone = await strapi.documents(ABONE).update({
        documentId: mevcut.documentId,
        data: { sonKaynak: k, token: mevcut.token || tokenUret(), ...izin, ...(ciftOnay ? { durum: 'beklemede', iptalTarihi: null, iptalYontemi: null, ...(yeniDongu ? { onayGonderimi: 0 } : {}) } : aktifVeri) },
      });
      if (yeniDongu) abone.onayGonderimi = 0;
    }

    if (!ciftOnay) return { durum: 'aktif' };
    await q.update({ where: { id: abone.id }, data: { onayGonderimi: (abone.onayGonderimi || 0) + 1, sonOnayGonderimi: simdi } });
    return { durum: 'beklemede', gonder: abone };
  }).then(async (s) => {
    ozetGuncelle();
    if (s.gonder) {
      await onayGonder(s.gonder).catch((e) => strapi.log.error(`bulten: onay e-postasi gonderilemedi (${e.message})`));
      delete s.gonder;
    }
    return s;
  });

const tokenlaBul = async (token) => {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  return strapi.db.query(ABONE).findOne({ where: { token } });
};

const maskele = (e) => {
  const [a, d] = String(e).split('@');
  return `${a.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, a.length - 2)))}@${d}`;
};

const islemYap = async ({ token, islem, ip }) => {
  const sonuc = await islemUygula({ token, islem, ip });
  if (islem !== 'bilgi') ozetGuncelle();
  return sonuc;
};

const islemUygula = async ({ token, islem, ip }) => {
  const abone = await tokenlaBul(token);
  if (!abone) return { hata: [404, 'gecersiz_baglanti'] };
  const simdi = new Date();
  if (islem === 'onay' && abone.durum !== 'aktif') {
    await strapi.documents(ABONE).update({ documentId: abone.documentId, data: { durum: 'aktif', onayYontemi: 'cift-onay', onayTarihi: simdi, onayIp: ip || null, iptalTarihi: null, iptalYontemi: null } });
    return { durum: 'aktif', eposta: maskele(abone.eposta) };
  }
  if ((islem === 'iptal' || islem === 'tek-tik') && abone.durum !== 'iptal') {
    await strapi.documents(ABONE).update({ documentId: abone.documentId, data: { durum: 'iptal', iptalTarihi: simdi, iptalYontemi: islem === 'tek-tik' ? 'tek-tik' : 'baglanti' } });
    return { durum: 'iptal', eposta: maskele(abone.eposta) };
  }
  return { durum: abone.durum, eposta: maskele(abone.eposta) };
};

module.exports = { aboneKaydet, islemYap, tokenUret, ozetGuncelle, ozetHesapla, KAYNAKLAR };
