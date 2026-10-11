const puppeteer = require('puppeteer-core');
const fs = require('fs');

const B = 'https://cms.sunucumweb.com';
const TOKEN = process.env.TOKEN;
const EN = /\b(the|and|your|you|with|this|that|from|have|has|are|is|no|not|add|create|edit|delete|save|cancel|settings|search|select|name|type|field|new|all|view|more|learn|open|close|back|next|see|go|get|use|user|users|role|roles|content|media|library|file|files|upload|entry|entries|draft|published|publish|filter|filters|columns|actions|admin|panel|welcome|log|login|logout|password|email|documentation|tokens?|token|overview|plugins?|marketplace|profile|release|releases|workflow|locale|locales)\b/i;

(async () => {
  const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--lang=en-US'] });
  const pg = await br.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  const sonuc = {};
  const oku = async (etiket) => {
    await new Promise((r) => setTimeout(r, 2500));
    const t = await pg.evaluate(() => {
      const a = document.getElementById('strapi').innerText.split(/\n/).map((x) => x.trim()).filter(Boolean);
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach((e) => ['placeholder', 'aria-label', 'title'].forEach((k) => e.getAttribute(k) && a.push('@' + k + ': ' + e.getAttribute(k))));
      return { url: location.pathname, title: document.title, lang: document.documentElement.lang, metin: [...new Set(a)], linkler: [...document.querySelectorAll('nav a, a[href^="/admin"]')].map((x) => x.getAttribute('href')) };
    });
    sonuc[etiket] = t;
  };

  await pg.goto(B + '/admin/auth/login', { waitUntil: 'networkidle2' });
  await oku('login');
  await pg.evaluate((t) => { localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('jwtToken', JSON.stringify(t)); }, TOKEN);
  await pg.goto(B + '/admin', { waitUntil: 'networkidle2' });
  await oku('home');

  const yollar = [
    '/admin/content-manager', '/admin/content-type-builder', '/admin/plugins/upload', '/admin/me',
    '/admin/settings', '/admin/settings/application-infos', '/admin/settings/api-tokens', '/admin/settings/api-tokens/create',
    '/admin/settings/transfer-tokens', '/admin/settings/webhooks', '/admin/settings/webhooks/create', '/admin/settings/users', '/admin/settings/roles',
    '/admin/settings/media-library', '/admin/settings/email', '/admin/settings/internationalization', '/admin/settings/releases',
    '/admin/settings/review-workflows', '/admin/settings/purchase-audit-logs', '/admin/settings/purchase-single-sign-on', '/admin/marketplace',
    '/admin/plugins/content-releases', '/admin/settings/users-permissions/roles', '/admin/settings/admin-tokens', '/admin/settings/list-plugins', '/admin/settings/roles/2', '/admin/settings/users/1',
    ...(process.env.EK ? process.env.EK.split(',') : []),
  ];
  for (const y of yollar) {
    try {
      await pg.goto(B + y, { waitUntil: 'networkidle2', timeout: 30000 });
      await oku(y);
    } catch (e) {
      sonuc[y] = { hata: String(e) };
    }
  }
  await br.close();
  fs.writeFileSync('sonuc.json', JSON.stringify(sonuc, null, 1));
  const rapor = [];
  const linkler = new Set();
  for (const [k, v] of Object.entries(sonuc)) {
    if (v.hata) { rapor.push(`${k}: HATA ${v.hata}`); continue; }
    v.linkler.forEach((l) => l && linkler.add(l));
    const strapi = v.metin.filter((x) => /strapi/i.test(x));
    const ing = v.metin.filter((x) => EN.test(x) && !/[çğıöşüÇĞİÖŞÜ]/.test(x) && x.length > 2);
    rapor.push(`== ${k} -> ${v.url} [${v.title}] lang=${v.lang}`);
    if (strapi.length) rapor.push('  STRAPI: ' + JSON.stringify(strapi));
    if (ing.length) rapor.push('  ING?: ' + JSON.stringify(ing));
  }
  rapor.push('LINKLER: ' + [...linkler].sort().join(' '));
  fs.writeFileSync('rapor.txt', rapor.join('\n'));
  console.log('bitti');
})();
