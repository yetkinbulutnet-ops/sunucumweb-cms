'use strict';

const SOZLUK = 'api::arayuz-metni.arayuz-metni';
let onbellek = null;
let zaman = 0;

const sozlukGetir = async () => {
  if (onbellek && Date.now() - zaman < 30000) return onbellek;
  const satirlar = await strapi.db.query(SOZLUK).findMany({ select: ['anahtar', 'metin'], where: { anahtar: { $startsWith: 'eposta.' } }, limit: 1000 });
  onbellek = Object.fromEntries(satirlar.map((s) => [s.anahtar, s.metin]));
  zaman = Date.now();
  return onbellek;
};

const metinlerAl = async () => {
  let s = {};
  try {
    s = await sozlukGetir();
  } catch (e) {
    strapi.log.warn(`sozluk okunamadi (${e.message})`);
  }
  return (anahtar, degerler, yedek = '') => {
    let t = s[anahtar] ?? yedek;
    if (degerler) t = t.replace(/\{(\w+)\}/g, (_, a) => (degerler[a] ?? ''));
    return t;
  };
};

module.exports = { metinlerAl };
