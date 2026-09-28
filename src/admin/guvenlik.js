const asilFetch = window.fetch.bind(window);
let sonToken = null;
let durum = null;
let captchaYukleniyor = false;
let captchaWidget = null;
let captchaKutu = null;

const CSS = `
.swb-kaplama{position:fixed;inset:0;z-index:2147483000;background:rgba(3,7,12,.75);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;font-family:inherit}
.swb-kart{width:100%;max-width:500px;background:#141b24;border:1px solid #232e3b;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.5);color:#c9d4e0;padding:32px;box-sizing:border-box;margin:auto}
.swb-kart.genis{max-width:760px}
.swb-kart h2{margin:0 0 10px;font-size:24px;line-height:1.3;color:#f3f6fa;font-weight:700}
.swb-kart p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#9fb0c2}
.swb-kart p b{color:#e8eef5}
.swb-uyari{margin:0 0 18px;padding:14px 16px;border-radius:10px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.35);color:#fcd34d;font-size:14px;line-height:1.55}
.swb-bilgi{margin:0 0 18px;padding:14px 16px;border-radius:10px;background:#112d2f;border:1px solid #184444;color:#99f6e4;font-size:14px;line-height:1.55}
.swb-kod{width:100%;box-sizing:border-box;padding:16px 12px;font-size:32px;letter-spacing:.45em;text-indent:.45em;text-align:center;font-family:Consolas,Menlo,monospace;background:#0b1017;border:1px solid #2e3b4b;border-radius:12px;color:#f3f6fa;outline:none}
.swb-kod:focus{border-color:#14b8a6;box-shadow:0 0 0 3px rgba(20,184,166,.25)}
.swb-hata{min-height:20px;margin:12px 0 0;font-size:14px;color:#f87171}
.swb-sure{margin:8px 0 0;font-size:14px;color:#8a9bb0}
.swb-butonlar{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.swb-btn{appearance:none;border:1px solid #2e3b4b;background:#0b1017;color:#e8eef5;border-radius:10px;padding:13px 20px;font-size:15px;font-weight:600;cursor:pointer;line-height:1.2;font-family:inherit}
.swb-btn:hover{border-color:#3d4d60}
.swb-btn:disabled{opacity:.5;cursor:not-allowed}
.swb-btn.ana{background:#0d9488;border-color:#0d9488;color:#fff;flex:1 1 160px}
.swb-btn.ana:hover{background:#14b8a6}
.swb-link{appearance:none;background:none;border:0;color:#2dd4bf;font-size:14px;cursor:pointer;padding:0;font-family:inherit}
.swb-link:disabled{color:#6b7d91;cursor:default}
.swb-captcha{display:flex;justify-content:center;margin:4px 0 16px;min-height:78px;max-width:100%;overflow:hidden}
.swb-bant{margin:0 0 18px;padding:14px 16px;border-radius:10px;font-size:14px;line-height:1.55}
.swb-bant.uyari{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.35);color:#fcd34d}
.swb-bant.bilgi{background:#112d2f;border:1px solid #184444;color:#99f6e4}
.swb-liste{display:grid;gap:14px;margin:0 0 6px}
.swb-oturum{border:1px solid #232e3b;border-radius:12px;padding:18px 20px;background:#0f151d}
.swb-oturum.bu{border-color:#14b8a6;background:#0f1f22}
.swb-ust{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:14px}
.swb-cihaz{font-weight:700;color:#f3f6fa;font-size:16px;min-width:0;overflow-wrap:anywhere}
.swb-rozet{font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;white-space:nowrap}
.swb-rozet.bu{background:#14b8a6;color:#04201d}
.swb-rozet.aktif{background:#112d2f;color:#5eead4;border:1px solid #184444}
.swb-rozet.kapali{background:#1c2430;color:#9fb0c2;border:1px solid #2e3b4b}
.swb-detay{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px 20px}
.swb-detay div{min-width:0}
.swb-detay span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7d91;margin-bottom:2px}
.swb-detay strong{display:block;font-size:15px;color:#c9d4e0;font-weight:600;overflow-wrap:anywhere}
.swb-sayfa{padding:40px 56px;max-width:980px;box-sizing:border-box}
.swb-sayfa h1{margin:0 0 8px;font-size:32px;color:#f3f6fa;font-weight:700}
.swb-sayfa > p{margin:0 0 24px;color:#9fb0c2;font-size:16px;line-height:1.6}
@media (max-width:640px){.swb-sayfa{padding:24px 16px}.swb-kart{padding:22px}.swb-kart h2{font-size:21px}.swb-kod{font-size:26px}}
@media (max-width:400px){.swb-captcha{min-height:68px}.swb-captcha > div{transform:scale(.84);transform-origin:center top}}
@media (max-width:340px){.swb-captcha{min-height:62px}.swb-captcha > div{transform:scale(.76)}}
`;

const stilEkle = () => {
  if (document.getElementById('swb-guvenlik-stil')) return;
  const st = document.createElement('style');
  st.id = 'swb-guvenlik-stil';
  st.textContent = CSS;
  document.head.appendChild(st);
};

const el = (etiket, ozellik = {}, ...cocuklar) => {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(ozellik)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of cocuklar.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
};

const jsonYanit = (govde, status) => new Response(JSON.stringify(govde), { status, headers: { 'Content-Type': 'application/json' } });
const hataYanit = (mesaj, status = 400) => jsonYanit({ data: null, error: { status, name: 'ApplicationError', message: mesaj, details: {} } }, status);

const tarih = (d) => (d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const once = (d) => {
  if (!d) return '-';
  const sn = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });
  const a = Math.abs(sn);
  if (a < 60) return 'az önce';
  if (a < 3600) return rtf.format(Math.round(sn / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(sn / 3600), 'hour');
  return rtf.format(Math.round(sn / 86400), 'day');
};

const durumGetir = async () => {
  if (durum) return durum;
  try {
    const r = await asilFetch('/swb-guvenlik/durum', { credentials: 'same-origin' });
    durum = (await r.json()).data || {};
  } catch {
    durum = {};
  }
  return durum;
};

const captchaYukle = () => {
  if (window.grecaptcha?.render || captchaYukleniyor) return;
  captchaYukleniyor = true;
  window.swbCaptchaHazir = () => captchaCiz();
  const sc = document.createElement('script');
  sc.src = 'https://www.google.com/recaptcha/api.js?onload=swbCaptchaHazir&render=explicit&hl=tr';
  sc.async = true;
  sc.defer = true;
  document.head.appendChild(sc);
};

const captchaCiz = () => {
  if (!captchaKutu || !document.body.contains(captchaKutu) || captchaKutu.dataset.cizildi || !window.grecaptcha?.render || !durum?.siteAnahtari) return;
  captchaKutu.dataset.cizildi = '1';
  const ic = el('div');
  captchaKutu.append(ic);
  captchaWidget = window.grecaptcha.render(ic, { sitekey: durum.siteAnahtari, theme: 'dark' });
};

const captchaToken = () => {
  try {
    return captchaWidget != null ? window.grecaptcha.getResponse(captchaWidget) : '';
  } catch {
    return '';
  }
};

const captchaSifirla = () => {
  try {
    if (captchaWidget != null) window.grecaptcha.reset(captchaWidget);
  } catch {}
};

const girisSayfasi = () => /\/auth\/login\/?$/.test(location.pathname);
const unuttumSayfasi = () => /\/auth\/forgot-password\/?$/.test(location.pathname);

const bantEkle = (form, tur, metin) => {
  if (form.querySelector('.swb-bant')) return;
  form.prepend(el('div', { class: `swb-bant ${tur}`, role: 'status' }, metin));
};

const girisFormunuIsle = async () => {
  const giris = girisSayfasi();
  if (!giris && !unuttumSayfasi()) return;
  const form = document.querySelector('form');
  const btn = form && form.querySelector('button[type="submit"]');
  if (!form || !btn || !form.querySelector(giris ? 'input[name="password"]' : 'input[name="email"]')) return;
  if (form.querySelector('.swb-captcha')) return;
  captchaKutu = el('div', { class: 'swb-captcha' });
  btn.parentElement.insertBefore(captchaKutu, btn);
  captchaWidget = null;
  const d = await durumGetir();
  if (!giris) {
    if (window.grecaptcha?.render) captchaCiz();
    else captchaYukle();
    return;
  }
  const not = sessionStorage.getItem('swb_bildirim');
  if (not) {
    sessionStorage.removeItem('swb_bildirim');
    bantEkle(form, 'bilgi', not);
  } else if (d.bildirim) {
    const b = d.bildirim;
    bantEkle(
      form,
      'uyari',
      `Hesabınıza ${tarih(b.zaman)} tarihinde başka bir cihazdan${b.yeniCihaz ? ` (${b.yeniCihaz}${b.yeniKonum ? `, ${b.yeniKonum}` : ''})` : ''} giriş yapıldığı için bu cihazdaki oturumunuz sonlandırıldı. Hesap başına yalnızca bir cihaz tanımlanabilir.`
    );
  }
  if (window.grecaptcha?.render) captchaCiz();
  else captchaYukle();
};

const ikiAdimPenceresi = (detay) =>
  new Promise((coz) => {
    let bitisZamani = Date.now() + (detay.sure || 600) * 1000;
    let bekle = detay.yenidenGonder || 60;
    let calisiyor = false;
    const giris = el('input', { class: 'swb-kod', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', 'aria-label': 'Doğrulama kodu', placeholder: '••••••' });
    const hataP = el('p', { class: 'swb-hata', role: 'alert' });
    const sureP = el('p', { class: 'swb-sure' });
    const yenile = el('button', { class: 'swb-link', type: 'button', disabled: true });
    const dogrulaBtn = el('button', { class: 'swb-btn ana', type: 'button' }, 'Doğrula');
    const iptalBtn = el('button', { class: 'swb-btn', type: 'button' }, 'İptal');
    const kart = el(
      'div',
      { class: 'swb-kart', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'swb-iki-baslik' },
      el('h2', { id: 'swb-iki-baslik' }, 'E-posta doğrulaması'),
      el('p', {}, el('b', {}, detay.eposta || 'E-posta'), ' adresine 6 haneli bir doğrulama kodu gönderdik. Girişi tamamlamak için kodu girin.'),
      detay.digerCihaz
        ? el('div', { class: 'swb-uyari' }, `Bu hesap şu anda başka bir cihazda açık${typeof detay.digerCihaz === 'string' ? ` (${detay.digerCihaz})` : ''}. Doğrulamayı tamamlarsanız o cihazdaki oturum kapatılacak ve bu cihaz hesabınızın tek kayıtlı cihazı olacak.`)
        : el('div', { class: 'swb-bilgi' }, 'Hesap başına yalnızca bir cihaz tanımlanabilir. Doğrulamadan sonra bu cihaz kayıtlı cihazınız olur ve sonraki girişlerde kod istenmez.'),
      giris,
      hataP,
      sureP,
      el('p', { class: 'swb-sure' }, yenile),
      el('div', { class: 'swb-butonlar' }, dogrulaBtn, iptalBtn)
    );
    const kaplama = el('div', { class: 'swb-kaplama' }, kart);
    document.body.append(kaplama);
    setTimeout(() => giris.focus(), 50);

    const zamanlayici = setInterval(() => {
      const kalan = Math.max(0, Math.round((bitisZamani - Date.now()) / 1000));
      sureP.textContent = kalan > 0 ? `Kodun geçerlilik süresi: ${String(Math.floor(kalan / 60)).padStart(2, '0')}:${String(kalan % 60).padStart(2, '0')}` : 'Kodun süresi doldu. Yeni kod isteyin.';
      if (bekle > 0) bekle -= 1;
      yenile.disabled = bekle > 0;
      yenile.textContent = bekle > 0 ? `Kodu yeniden gönder (${bekle} sn)` : 'Kodu yeniden gönder';
    }, 1000);

    const kapat = (yanit) => {
      clearInterval(zamanlayici);
      kaplama.remove();
      coz(yanit);
    };

    const gonder = async () => {
      const kod = giris.value.replace(/\D/g, '');
      if (kod.length !== 6 || calisiyor) {
        if (kod.length !== 6) hataP.textContent = 'Lütfen 6 haneli kodu girin.';
        return;
      }
      calisiyor = true;
      dogrulaBtn.disabled = true;
      hataP.textContent = '';
      try {
        const r = await asilFetch('/swb-guvenlik/dogrula', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kimlik: detay.kimlik, kod }),
        });
        const j = await r.json();
        if (r.ok && j.data?.token) return kapat(jsonYanit(j, 200));
        if (j.error?.details?.bitti) return kapat(hataYanit(j.error.message));
        hataP.textContent = j.error?.message || 'Doğrulama başarısız.';
        giris.select();
      } catch {
        hataP.textContent = 'Bağlantı hatası. Lütfen tekrar deneyin.';
      } finally {
        calisiyor = false;
        dogrulaBtn.disabled = false;
      }
    };

    giris.addEventListener('input', () => {
      giris.value = giris.value.replace(/\D/g, '').slice(0, 6);
      if (giris.value.length === 6) gonder();
    });
    giris.addEventListener('keydown', (e) => e.key === 'Enter' && gonder());
    dogrulaBtn.addEventListener('click', gonder);
    iptalBtn.addEventListener('click', () => kapat(hataYanit('Giriş iptal edildi.')));
    yenile.addEventListener('click', async () => {
      yenile.disabled = true;
      hataP.textContent = '';
      try {
        const r = await asilFetch('/swb-guvenlik/yeniden-gonder', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kimlik: detay.kimlik }),
        });
        const j = await r.json();
        if (r.ok) {
          bekle = detay.yenidenGonder || 60;
          bitisZamani = Date.now() + (detay.sure || 600) * 1000;
          hataP.textContent = '';
          sureP.textContent = 'Yeni kod gönderildi.';
        } else hataP.textContent = j.error?.message || 'Kod gönderilemedi.';
      } catch {
        hataP.textContent = 'Bağlantı hatası.';
      }
    });
  });

const girisFetch = async (input, init) => {
  const istek = input instanceof Request ? input : null;
  const hedef = istek ? istek.url : String(input instanceof URL ? input.href : input);
  const basliklar = new Headers(init?.headers || (istek ? istek.headers : undefined));
  let govde = {};
  try {
    govde = JSON.parse(init?.body != null ? init.body : istek ? await istek.clone().text() : '{}');
  } catch {}
  const token = captchaToken();
  if (!token) return hataYanit('Lütfen "Ben robot değilim" doğrulamasını tamamlayın.');
  govde.captcha = token;
  basliklar.set('Content-Type', 'application/json');
  let yanit;
  try {
    yanit = await asilFetch(hedef, { method: 'POST', headers: basliklar, body: JSON.stringify(govde), credentials: 'same-origin' });
  } catch (e) {
    captchaSifirla();
    throw e;
  }
  captchaSifirla();
  let j = null;
  try {
    j = await yanit.clone().json();
  } catch {}
  if (yanit.status === 401 && j?.error?.name === 'SwbIkiAdim') {
    yanit = await ikiAdimPenceresi(j.error.details || {});
    try {
      j = await yanit.clone().json();
    } catch {}
  }
  if (yanit.ok && j?.data?.token) {
    sonToken = j.data.token;
    sessionStorage.setItem('swb_oturum_goster', '1');
  }
  return yanit;
};

const unuttumFetch = async (input, init) => {
  const istek = input instanceof Request ? input : null;
  const hedef = istek ? istek.url : String(input instanceof URL ? input.href : input);
  const basliklar = new Headers(init?.headers || (istek ? istek.headers : undefined));
  let govde = {};
  try {
    govde = JSON.parse(init?.body != null ? init.body : istek ? await istek.clone().text() : '{}');
  } catch {}
  const token = captchaToken();
  if (!token) return hataYanit('Lütfen "Ben robot değilim" doğrulamasını tamamlayın.');
  govde.captcha = token;
  basliklar.set('Content-Type', 'application/json');
  try {
    return await asilFetch(hedef, { method: 'POST', headers: basliklar, body: JSON.stringify(govde), credentials: 'same-origin' });
  } finally {
    captchaSifirla();
  }
};

const baslikTokeni =(input, init) => {
  const h = init?.headers || (input instanceof Request ? input.headers : null);
  if (!h) return;
  const v = h instanceof Headers ? h.get('Authorization') : h.Authorization || h.authorization;
  if (typeof v === 'string' && v.startsWith('Bearer ')) sonToken = v.slice(7);
};

const kancalar = [];
export const istekKancasiEkle = (f) => kancalar.push(f);

window.fetch = async (input, init) => {
  let yol = '';
  try {
    yol = new URL(input instanceof Request ? input.url : String(input instanceof URL ? input.href : input), location.origin).pathname;
  } catch {}
  baslikTokeni(input, init);
  const yontem = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  for (const k of kancalar) {
    try {
      init = k(yol, yontem, init) || init;
    } catch {}
  }
  if (yol === '/admin/login' && yontem === 'POST') return girisFetch(input, init);
  if (yol === '/admin/forgot-password' && yontem === 'POST') return unuttumFetch(input, init);
  const yanit = await asilFetch(input, init);
  if ((yol === '/admin/reset-password' || yol === '/admin/register') && yanit.ok) {
    try {
      const j = await yanit.clone().json();
      if (j.data?.swbYonlendir) {
        sessionStorage.setItem('swb_bildirim', j.data.mesaj || 'Lütfen giriş yapın.');
        location.assign(j.data.swbYonlendir);
        return new Promise(() => {});
      }
    } catch {}
  }
  if (yol === '/admin/access-token' && yanit.ok) {
    try {
      const j = await yanit.clone().json();
      if (j.data?.token) sonToken = j.data.token;
    } catch {}
  }
  return yanit;
};

const tokenBekle = async () => {
  for (let i = 0; i < 50 && !sonToken; i++) await new Promise((r) => setTimeout(r, 100));
  return sonToken;
};

export const yetkiliFetch = async (yol, secenek = {}) => {
  const t = await tokenBekle();
  if (!t) throw new Error('Oturum bulunamadı');
  return asilFetch(yol, { ...secenek, headers: { 'Content-Type': 'application/json', ...(secenek.headers || {}), Authorization: `Bearer ${t}` }, credentials: 'same-origin' });
};

const oturumlariGetir = async () => {
  const t = await tokenBekle();
  if (!t) throw new Error('Oturum bulunamadı');
  const r = await asilFetch('/swb-guvenlik/oturumlar', { headers: { Authorization: `Bearer ${t}` }, credentials: 'same-origin' });
  if (!r.ok) throw new Error('Oturum bilgileri alınamadı');
  return (await r.json()).data;
};

const oturumKarti = (o) =>
  el(
    'div',
    { class: `swb-oturum${o.buCihaz ? ' bu' : ''}` },
    el(
      'div',
      { class: 'swb-ust' },
      el('span', { class: 'swb-cihaz' }, `${o.tarayici}, ${o.isletim} (${o.tur})`),
      o.buCihaz ? el('span', { class: 'swb-rozet bu' }, 'Bu cihaz') : null,
      el('span', { class: `swb-rozet ${o.durum}` }, o.durum === 'aktif' ? 'Aktif' : `Kapalı${o.neden ? `: ${o.neden}` : ''}`)
    ),
    el(
      'div',
      { class: 'swb-detay' },
      el('div', {}, el('span', {}, 'IP adresi'), el('strong', {}, o.ip || '-')),
      el('div', {}, el('span', {}, 'Konum'), el('strong', {}, o.konum || '-')),
      el('div', {}, el('span', {}, 'Giriş'), el('strong', {}, tarih(o.giris))),
      el('div', {}, el('span', {}, o.bitis ? 'Bitiş' : 'Son aktiflik'), el('strong', {}, o.bitis ? tarih(o.bitis) : once(o.sonAktif))),
      el('div', {}, el('span', {}, 'Doğrulama'), el('strong', {}, `${o.dogrulama}${o.beniHatirla ? ', beni hatırla açık' : ''}`))
    )
  );

const oturumIcerigi = (veri) => {
  const kapsayici = el('div');
  kapsayici.append(
    el(
      'div',
      { class: 'swb-bilgi' },
      veri.kayitliCihaz
        ? `Kayıtlı cihazınız: ${veri.kayitliCihaz.ozet} (${tarih(veri.kayitliCihaz.kayit)} tarihinden beri). Hesap başına yalnızca bir cihaz tanımlanabilir; başka bir cihazdan e-posta doğrulamasıyla giriş yapılırsa bu cihazdaki oturum kapanır.`
        : 'Hesabınıza henüz kayıtlı cihaz tanımlanmamış.'
    ),
    veri.oturumlar.length ? el('div', { class: 'swb-liste' }, veri.oturumlar.map(oturumKarti)) : el('p', {}, 'Henüz oturum kaydı yok.')
  );
  return kapsayici;
};

const oturumPenceresi = async () => {
  let veri;
  try {
    veri = await oturumlariGetir();
  } catch {
    return;
  }
  stilEkle();
  const tamam = el('button', { class: 'swb-btn ana', type: 'button' }, 'Tamam');
  const kart = el(
    'div',
    { class: 'swb-kart genis', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'swb-oturum-baslik' },
    el('h2', { id: 'swb-oturum-baslik' }, 'Güvenlik özeti'),
    el('p', {}, 'Hesabınızdaki son 3 oturum aşağıda listelenmiştir. Tanımadığınız bir giriş görürseniz şifrenizi hemen değiştirin.'),
    oturumIcerigi(veri),
    el('div', { class: 'swb-butonlar' }, tamam)
  );
  const kaplama = el('div', { class: 'swb-kaplama' }, kart);
  const kapat = () => kaplama.remove();
  tamam.addEventListener('click', kapat);
  kaplama.addEventListener('click', (e) => e.target === kaplama && kapat());
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') {
      kapat();
      document.removeEventListener('keydown', esc);
    }
  });
  document.body.append(kaplama);
  tamam.focus();
};

export const oturumSayfasiCiz = async (kok) => {
  stilEkle();
  kok.replaceChildren(
    el(
      'div',
      { class: 'swb-sayfa' },
      el('h1', {}, 'Oturum Güvenliği'),
      el('p', {}, 'Hesabınızın son 3 oturumu, kayıtlı cihazınız ve giriş bilgileri. Girişler e-posta doğrulaması (2FA) ve tek cihaz kuralıyla korunur.'),
      el('p', {}, 'Yükleniyor…')
    )
  );
  try {
    const veri = await oturumlariGetir();
    kok.querySelector('.swb-sayfa').lastChild.replaceWith(oturumIcerigi(veri));
  } catch (e) {
    kok.querySelector('.swb-sayfa').lastChild.textContent = e.message;
  }
};

export const guvenlikBaslat = () => {
  stilEkle();
  let bekliyor = false;
  const kontrol = () => {
    bekliyor = false;
    if (girisSayfasi() || unuttumSayfasi()) girisFormunuIsle();
    else if (sessionStorage.getItem('swb_oturum_goster') && !location.pathname.includes('/auth/')) {
      sessionStorage.removeItem('swb_oturum_goster');
      setTimeout(oturumPenceresi, 600);
    }
  };
  new MutationObserver(() => {
    if (!bekliyor) {
      bekliyor = true;
      requestAnimationFrame(kontrol);
    }
  }).observe(document.body, { childList: true, subtree: true });
  kontrol();
};
