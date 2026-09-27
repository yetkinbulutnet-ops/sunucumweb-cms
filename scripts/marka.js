const fs = require('fs');
const path = require('path');

const MARKA = 'SunucumWEB Admin';
const ALTYAPI = 'YetkinWeb Systems';
const dizin = path.join(__dirname, '..', 'build');

const html = path.join(dizin, 'index.html');
const surum = require('crypto').createHash('md5').update(fs.readFileSync(path.join(__dirname, '..', 'public', 'marka', 'favicon.png'))).digest('hex').slice(0, 8);
const ikonlar = `<link rel="icon" type="image/png" sizes="256x256" href="/marka/favicon.png?v=${surum}"/><link rel="shortcut icon" href="/marka/favicon.png?v=${surum}"/><link rel="apple-touch-icon" href="/marka/apple-touch-icon.png?v=${surum}"/>`;
let h = fs.readFileSync(html, 'utf8');
h = h
  .replace(/<html lang="en">/, '<html lang="tr">')
  .replace(/<link rel="(?:shortcut )?icon"[^>]*>|<link rel="apple-touch-icon"[^>]*>/g, '')
  .replace(/<title>[^<]*<\/title>/, `<title>${MARKA}</title>${ikonlar}`)
  .replace('<h1>JavaScript disabled</h1>', '<h1>JavaScript kapalı</h1>')
  .replace(/<p>Please <a href="https:\/\/www\.enable-javascript\.com\/">enable JavaScript<\/a> in your browser and reload the page to proceed\.<\/p>/, '<p>Devam etmek için tarayıcınızda JavaScript\'i etkinleştirip sayfayı yenileyin.</p>');
fs.writeFileSync(html, h);

const yamalar = [
  [/render\(\)\{const ([\w$]+)=([\w$]+)\(([\w$]+),this\.configurations\.locales\|\|\[\]\)/g, 'render(){const $1=$2($3,["tr"])'],
  [/(localStorage\.getItem\([\w$]+\)\|\|)"en"(,[\w$]+=[\w$]+\([\w$]+\);this\.store)/g, '$1"tr"$2'],
  [/language:\{locale:([\w$]+)\[([\w$]+)\]\?\2:"en",localeNames:\1\}/g, 'language:{locale:"tr",localeNames:$1}'],
  [/language:\{locale:"en",localeNames:\{en:"English"\}\}/g, 'language:{locale:"tr",localeNames:{tr:"Türkçe"}}'],
  [/currentTheme:localStorage\.getItem\(([\w$]+)\)\|\|"system"/g, 'currentTheme:"dark"'],
  [/label:([\w$]+)\.split\("::"\)\[1\]/g, 'label:({"content-type-builder":"İçerik Yapısı",email:"E-posta",upload:"Medya Kütüphanesi",i18n:"Dil"})[$1.split("::")[1]]||$1.split("::")[1]'],
  [/(defaultMessage:"Select all entries"\}\),name:([\w$]+),checked:[^}]*?,onCheckedChange:[\w$]+,children:)([\w$]+)\(\2\)/g, '$1({entry:"Kayıt",media:"Medya"})[$2]||$3($2)'],
];

const metinler = {
  '{name:"API Tokens"}': '{name:"API anahtarları"}',
  '{name:"Admin Tokens"}': '{name:"Yönetici anahtarları"}',
  '{name:"Roles"}': '{name:"Roller"}',
  '{name:"Transfer Tokens"}': '{name:"Aktarım anahtarları"}',
  '{name:"Users"}': '{name:"Kullanıcılar"}',
  '{name:"Webhooks"}': '{name:"Web kancaları"}',
  'defaultMessage:"Settings - {name}"': 'defaultMessage:"Ayarlar - {name}"',
  'placeholder:"Select"': 'placeholder:"Seçin"',
  'placeholder:"Select..."': 'placeholder:"Seçin..."',
  'placeholder:"Not supported"': 'placeholder:"Desteklenmiyor"',
};
const bulunan = new Array(yamalar.length).fill(0);

let n = 0;
for (const f of fs.readdirSync(dizin)) {
  if (!f.endsWith('.js')) continue;
  const yol = path.join(dizin, f);
  const s = fs.readFileSync(yol, 'utf8');
  let y = s.split('| Strapi`').join(`| ${MARKA}\``).split('"Strapi Admin"').join(`"${MARKA}"`);
  for (const [eski, yeni] of Object.entries(metinler)) y = y.split(eski).join(yeni);
  y = y.replace(/"((?:[^"\\\n]|\\.)*?)"/g, (tam, ic) => (ic.includes(' ') && /\bStrapi\b/.test(ic) ? `"${ic.replace(/\bStrapi\b/g, ALTYAPI)}"` : tam));
  yamalar.forEach(([re, yeni], i) => {
    const onceki = y;
    y = y.replace(re, yeni);
    if (y !== onceki) bulunan[i]++;
  });
  if (y !== s) {
    fs.writeFileSync(yol, y);
    n++;
  }
}
console.log(`marka: ${n} dosya, yamalar: ${bulunan.join('/')}`);
if (bulunan.slice(0, 3).some((b) => b === 0)) {
  console.error('marka: dil yamasi bulunamadi');
  process.exit(1);
}
