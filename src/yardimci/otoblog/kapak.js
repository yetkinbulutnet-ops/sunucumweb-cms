'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');

const G = 1600;
const Y = 900;
const KENAR = 150;
const LOGO = path.join(__dirname, '..', '..', 'admin', 'extensions', 'logo-ikon.png');

let fontlar = null;
const fontYukle = () => {
  if (fontlar) return fontlar;
  const klasor = path.join(path.dirname(require.resolve('@fontsource/poppins/package.json')), 'files');
  const yukle = (ad) => {
    const b = fs.readFileSync(path.join(klasor, ad));
    return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  };
  fontlar = {
    700: [yukle('poppins-latin-700-normal.woff'), yukle('poppins-latin-ext-700-normal.woff')],
    500: [yukle('poppins-latin-500-normal.woff'), yukle('poppins-latin-ext-500-normal.woff')],
  };
  return fontlar;
};

const glifFontu = (liste, k) => liste.find((f) => f.charToGlyphIndex(k) > 0) || liste[0];

const genislik = (metin, kalinlik, boy) => {
  const liste = fontYukle()[kalinlik];
  let t = 0;
  for (const k of metin) {
    const f = glifFontu(liste, k);
    t += f.charToGlyph(k).advanceWidth * (boy / f.unitsPerEm);
  }
  return t;
};

const n = (v) => Math.round(v * 100) / 100;

const glifYolu = (g, x, y, o) =>
  g.path.commands
    .map((c) => {
      if (c.type === 'Z') return 'Z';
      const p = (a, b) => `${n(x + a * o)} ${n(y - b * o)}`;
      if (c.type === 'M' || c.type === 'L') return `${c.type}${p(c.x, c.y)}`;
      if (c.type === 'Q') return `Q${p(c.x1, c.y1)} ${p(c.x, c.y)}`;
      if (c.type === 'C') return `C${p(c.x1, c.y1)} ${p(c.x2, c.y2)} ${p(c.x, c.y)}`;
      return '';
    })
    .join('');

const yol = (metin, x, y, kalinlik, boy) => {
  const liste = fontYukle()[kalinlik];
  let d = '';
  let imlec = x;
  for (const k of metin) {
    const f = glifFontu(liste, k);
    const g = f.charToGlyph(k);
    const o = boy / f.unitsPerEm;
    d += glifYolu(g, imlec, y, o);
    imlec += g.advanceWidth * o;
  }
  return d;
};

const satirla = (metin, kalinlik, boy, sinir) => {
  const kelimeler = String(metin).trim().split(/\s+/);
  const satirlar = [];
  let s = '';
  for (const w of kelimeler) {
    const aday = s ? `${s} ${w}` : w;
    if (genislik(aday, kalinlik, boy) <= sinir || !s) s = aday;
    else {
      satirlar.push(s);
      s = w;
    }
  }
  if (s) satirlar.push(s);
  return satirlar;
};

const baslikYerlestir = (baslik) => {
  const sinir = G - KENAR * 2;
  for (const boy of [84, 76, 68, 60, 54]) {
    const satirlar = satirla(baslik, 700, boy, sinir);
    if (satirlar.length <= 3) return { boy, satirlar };
  }
  const boy = 54;
  const satirlar = satirla(baslik, 700, boy, sinir).slice(0, 3);
  satirlar[2] = `${satirlar[2].replace(/[\s,.:;]+\S*$/, '')}...`;
  return { boy, satirlar };
};

const kacis = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const svgUret = ({ baslik, kategori }) => {
  const { boy, satirlar } = baslikYerlestir(baslik);
  const aralik = Math.round(boy * 1.22);
  const blokY = satirlar.length * aralik;
  const ust = Math.round((Y - blokY) / 2) + Math.round(boy * 0.62);
  const baslikYollari = satirlar.map((s, i) => yol(s, KENAR, ust + i * aralik, 700, boy)).join('');
  const kat = String(kategori || 'Blog').toLocaleUpperCase('tr');
  const katBoy = 24;
  const katY = ust - boy - 34;
  const katG = genislik(kat, 500, katBoy);
  const altYazi = 'sunucumweb.com/blog';
  const altBoy = 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${G}" height="${Y}" viewBox="0 0 ${G} ${Y}">
<defs>
<linearGradient id="z" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1017"/><stop offset="1" stop-color="#0f2942"/></linearGradient>
<radialGradient id="p" cx="0.88" cy="0.12" r="0.6"><stop offset="0" stop-color="#14b8a6" stop-opacity="0.28"/><stop offset="1" stop-color="#14b8a6" stop-opacity="0"/></radialGradient>
<pattern id="n" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#ffffff" fill-opacity="0.07"/></pattern>
</defs>
<rect width="${G}" height="${Y}" fill="url(#z)"/>
<rect width="${G}" height="${Y}" fill="url(#p)"/>
<rect x="${G - 620}" y="0" width="620" height="${Y}" fill="url(#n)"/>
<rect x="0" y="0" width="${G}" height="8" fill="#14b8a6"/>
<rect x="${KENAR}" y="${katY - katBoy - 14}" width="${Math.round(katG + 40)}" height="${katBoy + 30}" rx="${Math.round((katBoy + 30) / 2)}" fill="#14b8a6" fill-opacity="0.16" stroke="#2dd4bf" stroke-opacity="0.45"/>
<path d="${yol(kat, KENAR + 20, katY, 500, katBoy)}" fill="#5eead4"/>
<path d="${baslikYollari}" fill="#ffffff"/>
<path d="${yol(altYazi, KENAR + 70, Y - 92, 500, altBoy)}" fill="#8a9bb0"/>
<title>${kacis(baslik)}</title>
</svg>`;
};

const kapakUret = async ({ baslik, kategori }) => {
  const svg = svgUret({ baslik, kategori });
  const logo = await sharp(LOGO).resize(52, 52).png().toBuffer();
  return sharp(Buffer.from(svg))
    .composite([{ input: logo, left: KENAR, top: Y - 92 - 38 }])
    .webp({ quality: 86, effort: 5 })
    .toBuffer();
};

module.exports = { kapakUret, svgUret };
