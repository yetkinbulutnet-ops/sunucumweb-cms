import { istekKancasiEkle, yetkiliFetch } from './guvenlik';

const KIMLIK = 'swb-telefon';

const temizle = (v) => String(v || '').replace(/[^\d+ ()-]/g, '').slice(0, 20);

istekKancasiEkle((yol, yontem, init) => {
  if (yontem !== 'POST' || yol !== '/admin/users' || !init || typeof init.body !== 'string') return init;
  const g = document.getElementById(KIMLIK);
  if (!g || g.dataset.mod !== 'davet') return init;
  try {
    const b = JSON.parse(init.body);
    b.telefon = temizle(g.value).trim();
    return { ...init, body: JSON.stringify(b) };
  } catch {
    return init;
  }
});

const alanKoku = (girdi) => {
  let e = girdi.parentElement;
  while (e && e !== document.body) {
    if (e.querySelector('label')) return e;
    e = e.parentElement;
  }
  return null;
};

const hedefBul = () => {
  const yol = location.pathname;
  if (yol.includes('/auth/')) return null;
  const girdiler = [...document.querySelectorAll('input[name="email"]')].filter((g) => g.offsetParent);
  for (const g of girdiler) {
    const pencere = g.closest('[role="dialog"]');
    if (pencere && /\/settings\/users\/?$/.test(yol)) return { girdi: g, mod: 'davet' };
    if (!pencere && /\/admin\/me\/?$/.test(yol)) return { girdi: g, mod: 'me' };
    const m = yol.match(/\/settings\/users\/(\d+)\/?$/);
    if (!pencere && m) return { girdi: g, mod: m[1] };
  }
  return null;
};

const ekle = ({ girdi, mod }) => {
  const kap = girdi.closest('form') || girdi.closest('[role="dialog"]') || document.body;
  const mevcut = document.getElementById(KIMLIK);
  if (mevcut && kap.contains(mevcut) && mevcut.dataset.mod === mod) return;
  if (mevcut) mevcut.closest('[data-swb-telefon]')?.remove();
  const kok = alanKoku(girdi);
  if (!kok) return;
  const hucre = kok.parentElement && kok.parentElement.children.length === 1 ? kok.parentElement : kok;
  const kopya = hucre.cloneNode(true);
  kopya.setAttribute('data-swb-telefon', '');
  kopya.querySelectorAll('[id$="-hint"],[id$="-error"],p').forEach((e) => e.remove());
  const etiket = kopya.querySelector('label');
  const g = kopya.querySelector('input');
  if (!etiket || !g) return;
  etiket.textContent = 'Telefon';
  etiket.setAttribute('for', KIMLIK);
  [...g.attributes].forEach((a) => {
    if (!['class', 'style'].includes(a.name)) g.removeAttribute(a.name);
  });
  Object.assign(g, { id: KIMLIK, type: 'tel', value: '', placeholder: '0 5xx xxx xx xx', autocomplete: 'tel', inputMode: 'tel', maxLength: 20 });
  g.dataset.mod = mod;
  const not = document.createElement('small');
  not.style.cssText = 'display:block;margin-top:6px;font-size:12px;color:#8a9bb0;min-height:16px';
  not.textContent = mod === 'davet' ? 'İsteğe bağlı' : '';
  g.closest('div')?.after(not);
  hucre.after(kopya);

  if (mod === 'davet') {
    g.addEventListener('input', () => (g.value = temizle(g.value)));
    return;
  }
  const uc = `/swb-panel/telefon/${mod}`;
  yetkiliFetch(uc)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (j && document.activeElement !== g) g.value = j.data.telefon || '';
    })
    .catch(() => {});
  let zaman = null;
  g.addEventListener('input', () => {
    g.value = temizle(g.value);
    not.textContent = 'Kaydediliyor…';
    clearTimeout(zaman);
    zaman = setTimeout(async () => {
      try {
        const r = await yetkiliFetch(uc, { method: 'POST', body: JSON.stringify({ telefon: g.value.trim() }) });
        not.textContent = r.ok ? 'Kaydedildi' : 'Kaydedilemedi, tekrar deneyin';
      } catch {
        not.textContent = 'Kaydedilemedi, tekrar deneyin';
      }
    }, 900);
  });
};

export const telefonBaslat = () => {
  let bekliyor = false;
  const kontrol = () => {
    bekliyor = false;
    const h = hedefBul();
    if (h) ekle(h);
  };
  new MutationObserver(() => {
    if (bekliyor) return;
    bekliyor = true;
    requestAnimationFrame(kontrol);
  }).observe(document.body, { childList: true, subtree: true });
};
