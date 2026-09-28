import * as React from 'react';
import { ChevronDown, Search } from '@strapi/icons';
import { BOLUMLER } from './bolumler';
import { yetkiliFetch } from '../guvenlik';

const STIL = `
.swb-ym{display:flex;flex-direction:column;height:100%;min-height:100vh;width:100%;box-sizing:border-box;background:#141b24;border-right:1px solid #232e3b;font-family:inherit}
.swb-ym-ust{padding:22px 18px 14px}
.swb-ym-ust a{display:block;font-size:18px;font-weight:700;color:#f3f6fa;text-decoration:none}
.swb-ym-ust small{display:block;margin-top:2px;font-size:12px;color:#6b7d91}
.swb-ym-ara{display:flex;align-items:center;gap:8px;margin:0 14px 12px;padding:0 10px;border:1px solid #2e3b4b;border-radius:8px;background:#0b1017}
.swb-ym-ara svg{width:14px;height:14px;flex-shrink:0}
.swb-ym-ara svg path{fill:#6b7d91}
.swb-ym-ara input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#e8eef5;font:inherit;font-size:13px;padding:8px 0}
.swb-ym-ara:focus-within{border-color:#14b8a6}
.swb-ym-liste{flex:1;overflow-y:auto;padding:0 10px 24px}
.swb-ym-grup{margin-bottom:4px}
.swb-ym-baslik{appearance:none;display:flex;align-items:center;gap:10px;width:100%;padding:9px 8px;border:0;border-radius:8px;background:transparent;color:#c9d4e0;font:inherit;font-size:14px;font-weight:600;text-align:left;cursor:pointer}
.swb-ym-baslik:hover{background:#1c2430}
.swb-ym-baslik[aria-expanded="true"]{color:#f3f6fa}
.swb-ym-baslik.icinde{color:#f3f6fa}
.swb-ym-baslik .isaret{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.swb-ym-ikon{display:grid;place-items:center;flex-shrink:0;width:28px;height:28px;border-radius:8px}
.swb-ym-ikon svg{width:15px;height:15px}
.swb-ym-ikon svg path{fill:currentColor}
.swb-ym-ok{margin-left:auto;display:grid;place-items:center;transition:transform .2s}
.swb-ym-ok svg{width:12px;height:12px}
.swb-ym-ok svg path{fill:#6b7d91}
.swb-ym-baslik[aria-expanded="true"] .swb-ym-ok{transform:rotate(180deg)}
.swb-ym-alt{display:grid;grid-template-rows:0fr;transition:grid-template-rows .22s ease}
.swb-ym-alt[data-acik="true"]{grid-template-rows:1fr}
.swb-ym-alt > ul{overflow:hidden;list-style:none;margin:0;padding:0 0 0 22px}
.swb-ym-alt li a{display:flex;align-items:center;gap:8px;margin:1px 0;padding:7px 10px;border-left:2px solid #232e3b;color:#9fb0c2;font-size:13.5px;text-decoration:none;border-radius:0 6px 6px 0}
.swb-ym-alt li a:hover{color:#f3f6fa;background:#1c2430}
.swb-ym-alt li a[aria-current="page"]{color:#f3f6fa;background:#1c2430;border-left-color:var(--renk)}
.swb-ym-alt li a span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.swb-ym-alt li a b{font-size:11.5px;font-weight:600;color:#6b7d91;font-variant-numeric:tabular-nums}
.swb-ym-bos{padding:12px 10px;font-size:13px;color:#6b7d91}
@media (prefers-reduced-motion:reduce){.swb-ym-alt,.swb-ym-ok{transition:none}}
`;

const stilEkle = () => {
  if (document.getElementById('swb-ym-stil')) return;
  const s = document.createElement('style');
  s.id = 'swb-ym-stil';
  s.textContent = STIL;
  document.head.appendChild(s);
};

export const git = (yol) => {
  if (location.pathname + location.search === yol) return;
  history.pushState({}, '', yol);
  window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
};

const tam = (yol) => `/admin${yol}`;
const kucuk = (s) => String(s).toLocaleLowerCase('tr');
let acikGrup = null;
let sayilarOnbellek = null;

const aktifMi = (yol, hedef) => {
  const h = tam(hedef);
  return yol === h || yol.startsWith(`${h}/`) || yol.startsWith(`${h}?`);
};

export default function YonetimMenusu() {
  stilEkle();
  const [yol, setYol] = React.useState(location.pathname);
  const [acik, setAcik] = React.useState(acikGrup);
  const [ara, setAra] = React.useState('');
  const [sayilar, setSayilar] = React.useState(sayilarOnbellek || {});

  React.useEffect(() => {
    const guncelle = () => setYol(location.pathname);
    window.addEventListener('popstate', guncelle);
    window.addEventListener('swb-yol', guncelle);
    return () => {
      window.removeEventListener('popstate', guncelle);
      window.removeEventListener('swb-yol', guncelle);
    };
  }, []);

  React.useEffect(() => {
    yetkiliFetch('/swb-panel/ozet')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.sayilar) {
          sayilarOnbellek = j.data.sayilar;
          setSayilar(j.data.sayilar);
        }
      })
      .catch(() => {});
  }, []);

  const ac = (ad) => {
    const yeni = acik === ad ? null : ad;
    acikGrup = yeni;
    setAcik(yeni);
  };

  const tikla = (e, hedef) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    git(tam(hedef));
  };

  const q = kucuk(ara.trim());
  const sonuclar = q ? BOLUMLER.flatMap((b) => b.ogeler.filter((o) => kucuk(`${o.ad} ${o.aciklama} ${b.ad}`).includes(q)).map((o) => ({ ...o, renk: b.renk }))) : null;

  const oge = (o, renk) => (
    <li key={o.yol}>
      <a href={tam(o.yol)} onClick={(e) => tikla(e, o.yol)} aria-current={aktifMi(yol, o.yol) ? 'page' : undefined} style={{ '--renk': renk }} title={o.aciklama}>
        <span>{o.ad}</span>
        {o.uid && sayilar[o.uid] != null && <b>{sayilar[o.uid]}</b>}
      </a>
    </li>
  );

  return (
    <nav className="swb-ym" aria-label="Site Yönetimi">
      <div className="swb-ym-ust">
        <a href="/admin/yonetim" onClick={(e) => (e.preventDefault(), git('/admin/yonetim'))}>
          Site Yönetimi
        </a>
        <small>Sitedeki tüm içerikler</small>
      </div>
      <label className="swb-ym-ara">
        <Search />
        <input type="search" value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Bölüm ara" aria-label="Bölüm ara" />
      </label>
      <div className="swb-ym-liste">
        {sonuclar ? (
          sonuclar.length ? (
            <div className="swb-ym-alt" data-acik="true">
              <ul style={{ paddingLeft: 0 }}>{sonuclar.map((o) => oge(o, o.renk))}</ul>
            </div>
          ) : (
            <div className="swb-ym-bos">Eşleşen bölüm yok.</div>
          )
        ) : (
          BOLUMLER.map((b) => {
            const Ikon = b.ikon;
            const acikMi = acik === b.ad;
            const icinde = b.ogeler.some((o) => aktifMi(yol, o.yol));
            return (
              <div key={b.ad} className="swb-ym-grup">
                <button type="button" className={`swb-ym-baslik${icinde ? ' icinde' : ''}`} aria-expanded={acikMi} onClick={() => ac(b.ad)}>
                  <span className="swb-ym-ikon" style={{ background: `${b.renk}22`, color: b.renk }}>
                    <Ikon />
                  </span>
                  {b.ad}
                  {icinde && !acikMi && <span className="isaret" style={{ background: b.renk }} title="Şu an bu bölümdesiniz" />}
                  <span className="swb-ym-ok">
                    <ChevronDown />
                  </span>
                </button>
                <div className="swb-ym-alt" data-acik={acikMi}>
                  <ul>{b.ogeler.map((o) => oge(o, b.renk))}</ul>
                </div>
              </div>
            );
          })
        )}
      </div>
    </nav>
  );
}
