const fs = require('fs');
const hepsi = JSON.parse(fs.readFileSync('hepsi.json'));
const mevcut = JSON.parse(fs.readFileSync('mevcut-tr.json'));
const sozluk = {};
const sorun = [];
const yerTut = (s) => (s.match(/\{[\w-]+|<\/?[\w-]+>/g) || []).sort().join('|');
for (let i = 0; i < 5; i++) {
  const g = JSON.parse(fs.readFileSync(`girdi_${i}.json`));
  const c = JSON.parse(fs.readFileSync(`cikti_${i}.json`, 'utf8'));
  for (const [k, en] of Object.entries(g)) {
    const t = c[k];
    if (typeof t !== 'string' || !t.trim()) { sorun.push(['eksik', k, en]); continue; }
    if (yerTut(en) !== yerTut(t)) sorun.push(['yer-tutucu', en, t]);
    if (/strapi/i.test(t)) sorun.push(['strapi', en, t]);
    sozluk[en] = t;
  }
}
const cikti = {};
for (const [k, v] of Object.entries(mevcut)) cikti[k] = /strapi/i.test(v) ? (sozluk[v] || v.replace(/Strapi/g, 'YetkinWeb Systems')) : v;
for (const [k, v] of Object.entries(hepsi)) if (typeof v === 'string') cikti[k] = sozluk[v] || v;
cikti['app.components.LeftMenu.navbrand.title'] = 'SunucumWEB Admin';
cikti['app.components.LeftMenu.navbrand.workplace'] = 'YetkinWeb Systems';
cikti['Auth.form.welcome.title'] = "SunucumWEB Admin'e hoş geldiniz!";
cikti['Auth.form.welcome.subtitle'] = 'Yönetim panelinize giriş yapın';
cikti['Auth.form.button.login.strapi'] = 'SunucumWEB Admin ile giriş yap';
cikti['Settings.application.strapi-version'] = 'YetkinWeb Systems sürümü';
for (const [k, v] of Object.entries(cikti)) if (/strapi/i.test(v)) cikti[k] = v.replace(/Strapi/gi, 'YetkinWeb Systems');
const sirali = Object.fromEntries(Object.keys(cikti).sort().map((k) => [k, cikti[k]]));
fs.writeFileSync(process.argv[2], JSON.stringify(sirali, null, 2) + '\n');
console.log('anahtar', Object.keys(sirali).length, 'sorun', sorun.length);
fs.writeFileSync('sorun.json', JSON.stringify(sorun, null, 1));
