const fs = require('fs');
const eksik = JSON.parse(fs.readFileSync('eksik.json'));
const yeni = JSON.parse(fs.readFileSync('yeni.json'));
const unk = JSON.parse(fs.readFileSync('unk.json'));
const mevcut = JSON.parse(fs.readFileSync('mevcut-tr.json'));
const hepsi = { ...eksik };
for (const [k, v] of Object.entries(yeni)) {
  if (!/^[A-Za-z][\w-]*\.[\w.-]+$/.test(k) && !/^[A-Z]/.test(k)) continue;
  if (/^(true|false|null|window|FIXME|http)/.test(k)) continue;
  hepsi[k] = v;
}
for (const [, , id, v] of unk) {
  for (const p of ['upload', 'content-manager', 'content-type-builder', 'content-releases', 'review-workflows', 'i18n']) {
    const k = p + '.' + id;
    if (!(k in hepsi) && !(k in mevcut)) hepsi[k] = v;
  }
}
const degerler = [...new Set(Object.values(hepsi).filter((v) => typeof v === 'string' && /[A-Za-z]/.test(v)))];
const strapiTr = Object.entries(mevcut).filter(([, v]) => /strapi/i.test(v));
for (const [, v] of strapiTr) degerler.push(v);
console.log('anahtar', Object.keys(hepsi).length, 'benzersiz metin', degerler.length, 'strapi-tr', strapiTr.length);
fs.writeFileSync('hepsi.json', JSON.stringify(hepsi, null, 1));
const N = 5;
const boy = Math.ceil(degerler.length / N);
for (let i = 0; i < N; i++) {
  const parca = {};
  degerler.slice(i * boy, (i + 1) * boy).forEach((v, j) => { parca[`${i}_${j}`] = v; });
  fs.writeFileSync(`girdi_${i}.json`, JSON.stringify(parca, null, 1));
}
