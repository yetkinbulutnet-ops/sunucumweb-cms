'use strict';

const SITE_RE = /^https?:\/\/(?:www\.)?sunucumweb\.com(?=\/|$)/i;

const kucuk = (s) => String(s || '').toLocaleLowerCase('tr');

const temizle = (metin) =>
  String(metin || '')
    .replace(/\r\n/g, '\n')
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/\s*·\s*/g, ', ')
    .replace(/…/g, '...')
    .replace(/[→⇒➔➜]/g, '>')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/,\s*([.:;!?])(?=\s|$)/gm, '$1');

const tekSatir = (s) => etiketSil(temizle(s)).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

const etiketSil = (satir) => {
  let t = satir;
  let once;
  do {
    once = t;
    t = t.replace(/<\/?[a-z!][^<>]*>/gi, '');
  } while (t !== once);
  return t;
};

const yapiDuzelt = (md, baslik) => {
  let m = String(md || '').trim().replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i, '$1');
  const satirlar = m.split('\n');
  if (satirlar[0] && (/^#\s/.test(satirlar[0]) || (/^##\s/.test(satirlar[0]) && kucuk(satirlar[0].replace(/^#+\s*/, '')).trim() === kucuk(baslik).trim()))) satirlar.shift();
  m = satirlar.join('\n').trim();
  let kodda = false;
  m = m
    .split('\n')
    .map((s) => {
      if (/^\s*```/.test(s)) kodda = !kodda;
      if (kodda) return s;
      if (/^#\s/.test(s)) return `#${s}`;
      if (/^#{4,}\s/.test(s)) return s.replace(/^#+/, '###');
      return etiketSil(s).replace(/(\S) {2,}(?=\S)/g, '$1 ');
    })
    .join('\n');
  const sss = m.search(/^##\s+(sık sorulan sorular|sıkça sorulan sorular|sss)\b.*$/im);
  if (sss > 0) m = m.slice(0, sss).trim();
  return m.replace(/\n{3,}/g, '\n\n').trim();
};

const yolNormal = (url) => {
  let u = String(url || '').trim();
  if (SITE_RE.test(u)) u = u.replace(SITE_RE, '') || '/';
  if (!u.startsWith('/') || u.startsWith('//')) return null;
  u = u.split(/[?#]/)[0];
  if (u.length > 1) u = u.replace(/\/+$/, '');
  return u;
};

const linkDuzelt = (md, izinli) => {
  const kaldirilan = [];
  let tutulan = 0;
  const cikti = String(md).replace(/(!?)\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (tam, resim, metin, url) => {
    if (resim) {
      kaldirilan.push(url);
      return '';
    }
    const y = yolNormal(url);
    if (y && izinli.has(y)) {
      tutulan += 1;
      return `[${metin}](${y})`;
    }
    kaldirilan.push(url);
    return metin;
  });
  const temiz = cikti
    .split('\n')
    .filter((satir) => {
      const tanim = /^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+.*)?$/.exec(satir);
      if (!tanim) return true;
      const y = yolNormal(tanim[1]);
      if (y && izinli.has(y)) return true;
      kaldirilan.push(tanim[1]);
      return false;
    })
    .join('\n');
  return { metin: temiz, kaldirilan, tutulan };
};

const duzMetin = (md) =>
  String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' x ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_|\-]+/g, ' ');

const kelimeSay = (md) => (duzMetin(md).match(/[\p{L}\p{N}]+/gu) || []).length;

const yasakliListe = (ham) =>
  String(ham || '')
    .split(/\r?\n/)
    .map((s) => kucuk(s).trim())
    .filter(Boolean);

const yasakliBul = (metin, liste) => {
  const k = kucuk(metin);
  return liste.filter((i) => k.includes(i));
};

const sorunlariBul = (md, { kelimeMin, kelimeMax, yasakli }) => {
  const s = [];
  const kelime = kelimeSay(md);
  if (kelime < kelimeMin) s.push(`Yazı ${kelime} kelime, en az ${kelimeMin} kelime olmalı. Mevcut bölümleri somut örnek ve adımlarla genişlet.`);
  if (kelime > kelimeMax * 1.15) s.push(`Yazı ${kelime} kelime, en fazla ${kelimeMax} kelime olmalı. Tekrar eden kısımları kısalt.`);
  const bulunan = yasakliBul(md, yasakli);
  if (bulunan.length) s.push(`Şu kalıp ifadeler kullanılmış, bunları içeren cümleleri daha sade ve doğal yeniden yaz: ${bulunan.map((b) => `"${b}"`).join(', ')}`);
  const h2 = (md.match(/^##\s/gm) || []).length;
  if (h2 < 3) s.push('Yazıda en az 3 ana bölüm (## başlık) olmalı.');
  return { sorunlar: s, kelime, bulunan, h2 };
};

const DURAK = new Set('ve veya ile için bir bu şu o da de mi mı ne nasıl neden hangi gibi daha çok en her ya ki ama fakat siz sizin biz nedir olan olarak ise'.split(' '));

const kokler = (s) =>
  new Set(
    (kucuk(s).match(/[\p{L}\p{N}]+/gu) || [])
      .filter((w) => w.length > 2 && !DURAK.has(w))
      .map((w) => w.slice(0, 5))
  );

const benzerlik = (a, b) => {
  const x = kokler(a);
  const y = kokler(b);
  if (!x.size || !y.size) return 0;
  let ortak = 0;
  for (const w of x) if (y.has(w)) ortak += 1;
  return ortak / (x.size + y.size - ortak);
};

const kirp = (s, n) => {
  const t = tekSatir(s);
  if ([...t].length <= n) return t;
  const kes = [...t].slice(0, n).join('');
  const bosluk = kes.lastIndexOf(' ');
  return (bosluk > n * 0.6 ? kes.slice(0, bosluk) : kes).replace(/[\s,;:.-]+$/, '');
};

const HARF = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

const slugla = (s) => {
  const t = kucuk(s)
    .replace(/[çğıöşüâîû]/g, (h) => HARF[h])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (t.length <= 80) return t;
  const k = t.slice(0, 80);
  const i = k.lastIndexOf('-');
  return (i > 40 ? k.slice(0, i) : k).replace(/-+$/, '');
};

module.exports = { temizle, tekSatir, yapiDuzelt, linkDuzelt, yolNormal, kelimeSay, yasakliListe, yasakliBul, sorunlariBul, benzerlik, kirp, slugla };
