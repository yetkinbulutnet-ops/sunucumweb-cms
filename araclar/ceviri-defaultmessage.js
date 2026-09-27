const fs = require('fs');
const eksik = JSON.parse(fs.readFileSync('eksik.json'));
const mevcut = JSON.parse(fs.readFileSync('mevcut-tr.json'));
const pre = ['content-manager', 'content-releases', 'content-type-builder', 'email', 'i18n', 'users-permissions', 'review-workflows', 'upload'];
const unesc = (s) => { try { return JSON.parse('"' + s + '"'); } catch { return s; } };
const re = /id:\s*(?:([\w$]+)\()?(?:`|")([^"`$]+)(?:`|")\)?,\s*defaultMessage:\s*"((?:[^"\\]|\\.)*)"/g;
const fnPre = {};
const yeni = {};
let lit = 0, wr = 0;
const unk = [];
for (const f of fs.readdirSync('build')) {
  const s = fs.readFileSync('build/' + f, 'utf8');
  const local = {};
  const r2 = /([\w$]+)=\(?[\w$]+\)?=>`([a-z-]+)\.\$\{[\w$]+\}`/g;
  let q;
  while ((q = r2.exec(s))) local[q[1]] = q[2];
  const r3 = /function ([\w$]+)\([\w$]+\)\{return`([a-z-]+)\.\$\{[\w$]+\}`\}/g;
  while ((q = r3.exec(s))) local[q[1]] = q[2];
  let m;
  while ((m = re.exec(s))) {
    const [, fn, id, dm] = m;
    const v = unesc(dm);
    let keys;
    if (!fn) { keys = [id]; lit++; }
    else {
      wr++;
      if (local[fn]) keys = [local[fn] + '.' + id];
      else {
        keys = pre.map((p) => p + '.' + id).filter((k) => k in eksik || k in mevcut);
        if (!keys.length) { unk.push([f, fn, id, v]); continue; }
      }
    }
    for (const k of keys) { if (k in mevcut || k in eksik) continue; yeni[k] = v; }
  }
}
console.log('literal', lit, 'wrapped', wr, 'yeni', Object.keys(yeni).length, 'unk', unk.length);
fs.writeFileSync('yeni.json', JSON.stringify(yeni, null, 1));
fs.writeFileSync('unk.json', JSON.stringify(unk, null, 1));
