'use strict';

const sablon = require('../guvenlik/sablon');
const { metinlerAl } = require('./metin');

const MESAJ = 'api::iletisim-mesaji.iletisim-mesaji';
const PANEL = (process.env.PANEL_URL || 'https://cms.sunucumweb.com').replace(/\/+$/, '');

const yoneticiler = async () =>
  (await strapi.db.query('admin::user').findMany({ where: { isActive: true, blocked: false }, select: ['email', 'firstname'] })).map((u) => u.email).filter(Boolean);

const gonder = (secenek) => strapi.plugin('email').service('email').send(secenek);

const adminBildir = async (m) => {
  const alicilar = await yoneticiler();
  if (!alicilar.length) return;
  const t = await metinlerAl();
  const p = sablon.yeniMesaj({ t, m, baglanti: `${PANEL}/admin/mesajlar?id=${m.id}` });
  for (const to of alicilar) {
    await gonder({ to, from: process.env.MAIL_FROM, replyTo: `${m.ad.replace(/[<>"]/g, '')} <${m.eposta}>`, subject: p.subject, html: p.html, text: p.text }).catch((e) =>
      strapi.log.error(`mesaj: yonetici bildirimi gonderilemedi (${e.message})`)
    );
  }
};

const mesajKaydet = async (veri) => {
  const m = await strapi.documents(MESAJ).create({ data: { ...veri, durum: 'yeni', yanitlar: [] } });
  adminBildir(m).catch((e) => strapi.log.error(`mesaj: bildirim hatasi (${e.message})`));
  return m;
};

const yanitGonder = async ({ id, metin, kullanici }) => {
  const m = await strapi.db.query(MESAJ).findOne({ where: { id } });
  if (!m) return { hata: [404, 'Mesaj bulunamadı.'] };
  const temiz = String(metin || '').trim().slice(0, 8000);
  if (temiz.length < 2) return { hata: [400, 'Yanıt metni boş olamaz.'] };
  const t = await metinlerAl();
  const gonderenAd = [kullanici.firstname, kullanici.lastname].filter(Boolean).join(' ') || kullanici.email;
  const p = sablon.mesajYaniti({ t, m, yanit: temiz, gonderenAd });
  try {
    await gonder({
      to: m.eposta,
      from: process.env.MAIL_FROM_MUSTERI || process.env.MAIL_FROM,
      replyTo: process.env.MAIL_REPLY_TO || undefined,
      subject: p.subject,
      html: p.html,
      text: p.text,
    });
  } catch (e) {
    strapi.log.error(`mesaj: yanit gonderilemedi (${e.message})`);
    return { hata: [502, 'E-posta gönderilemedi. SMTP ayarlarını kontrol edin.'] };
  }
  const simdi = new Date();
  const yanitlar = [...(Array.isArray(m.yanitlar) ? m.yanitlar : []), { metin: temiz, tarih: simdi.toISOString(), gonderen: kullanici.email, gonderenAd }];
  const g = await strapi.db.query(MESAJ).update({ where: { id }, data: { yanitlar, durum: 'yanitlandi', sonYanitTarihi: simdi, okunmaTarihi: m.okunmaTarihi || simdi } });
  return { mesaj: g };
};

const DURUMLAR = new Set(['yeni', 'okundu', 'yanitlandi', 'arsiv']);

const mesajListesi = async ({ durum, sayfa = 1, boyut = 30 }) => {
  const where = DURUMLAR.has(durum) ? { durum } : durum === 'acik' ? { durum: { $ne: 'arsiv' } } : {};
  const [kayitlar, toplam] = await Promise.all([
    strapi.db.query(MESAJ).findMany({ where, orderBy: { createdAt: 'desc' }, offset: (sayfa - 1) * boyut, limit: boyut, select: ['id', 'ad', 'eposta', 'konuAdi', 'konu', 'mesaj', 'durum', 'createdAt', 'sonYanitTarihi'] }),
    strapi.db.query(MESAJ).count({ where }),
  ]);
  return { kayitlar: kayitlar.map((k) => ({ ...k, mesaj: String(k.mesaj || '').slice(0, 160) })), toplam };
};

const mesajSayilari = async () => {
  const q = strapi.db.query(MESAJ);
  const [yeni, okundu, yanitlandi, arsiv] = await Promise.all(['yeni', 'okundu', 'yanitlandi', 'arsiv'].map((durum) => q.count({ where: { durum } })));
  return { yeni, okundu, yanitlandi, arsiv, toplam: yeni + okundu + yanitlandi + arsiv };
};

const mesajGetir = async (id) => {
  const m = await strapi.db.query(MESAJ).findOne({ where: { id } });
  if (m && m.durum === 'yeni') return strapi.db.query(MESAJ).update({ where: { id }, data: { durum: 'okundu', okunmaTarihi: new Date() } });
  return m;
};

const durumDegistir = async (id, durum) => {
  if (!DURUMLAR.has(durum)) return null;
  return strapi.db.query(MESAJ).update({ where: { id }, data: { durum } });
};

module.exports = { mesajKaydet, yanitGonder, mesajListesi, mesajSayilari, mesajGetir, durumDegistir };
