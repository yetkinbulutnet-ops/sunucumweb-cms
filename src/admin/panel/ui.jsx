import * as React from 'react';
import { styled, keyframes, css } from 'styled-components';
import { useFetchClient } from '@strapi/strapi/admin';

export const sayiBicim = new Intl.NumberFormat('tr-TR');
export const sayi = (n) => sayiBicim.format(Math.round(Number(n) || 0));

export const sureYaz = (sn) => {
  const s = Math.round(Number(sn) || 0);
  if (s < 60) return `${s} sn`;
  const d = Math.floor(s / 60);
  if (d < 60) return `${d} dk ${s % 60} sn`;
  return `${Math.floor(d / 60)} sa ${d % 60} dk`;
};

export const zamanOnce = (t) => {
  const f = (Date.now() - new Date(t).getTime()) / 1000;
  if (f < 60) return 'az önce';
  if (f < 3600) return `${Math.floor(f / 60)} dk önce`;
  if (f < 86400) return `${Math.floor(f / 3600)} sa önce`;
  if (f < 7 * 86400) return `${Math.floor(f / 86400)} gün önce`;
  return new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const tarihUzun = (t) => new Date(t).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });

export const degisim = (d, o) => {
  if (!o) return d ? null : 0;
  return ((d - o) / o) * 100;
};

export const useVeri = (yol, bagimliliklar = [], yenileMs = 0) => {
  const { get } = useFetchClient();
  const [durum, setDurum] = React.useState({ veri: null, hata: null, yukleniyor: true });
  const cek = React.useCallback(async (sessiz) => {
    if (!sessiz) setDurum((d) => ({ ...d, yukleniyor: true }));
    try {
      const { data } = await get(yol);
      setDurum({ veri: data.data, hata: null, yukleniyor: false });
    } catch (e) {
      setDurum((d) => ({ veri: d.veri, hata: e?.response?.data?.error?.message || 'Veri alınamadı.', yukleniyor: false }));
    }
  }, [yol]);
  React.useEffect(() => {
    cek(false);
    if (!yenileMs) return undefined;
    const t = setInterval(() => cek(true), yenileMs);
    return () => clearInterval(t);
  }, [cek, ...bagimliliklar]);
  return { ...durum, yenile: () => cek(true) };
};

export const useSayac = (hedef, sure = 900) => {
  const [deger, setDeger] = React.useState(0);
  React.useEffect(() => {
    const son = Number(hedef) || 0;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setDeger(son);
    let bas = null;
    let id;
    const adim = (t) => {
      if (bas == null) bas = t;
      const o = Math.min(1, (t - bas) / sure);
      setDeger(son * (1 - Math.pow(1 - o, 3)));
      if (o < 1) id = requestAnimationFrame(adim);
    };
    id = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(id);
  }, [hedef, sure]);
  return deger;
};

const yukari = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}`;
const nabiz = keyframes`0%{box-shadow:0 0 0 0 rgba(45,212,191,.55)}70%{box-shadow:0 0 0 10px rgba(45,212,191,0)}100%{box-shadow:0 0 0 0 rgba(45,212,191,0)}`;
const ciz = keyframes`from{stroke-dashoffset:var(--uz)}to{stroke-dashoffset:0}`;
const belir = keyframes`from{opacity:0}to{opacity:1}`;
const donme = keyframes`to{transform:rotate(360deg)}`;

const hareketsiz = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
  }
`;

export const Sayfa = styled.div`
  padding: 0 56px 56px;
  box-sizing: border-box;
  @media (max-width: 900px) {
    padding: 0 16px 40px;
  }
`;

export const Kart = styled.section`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 16px;
  padding: ${({ $dolgu }) => $dolgu || '22px 24px'};
  min-width: 0;
  box-sizing: border-box;
  animation: ${yukari} 0.45s ease both;
  animation-delay: ${({ $gecikme }) => ($gecikme || 0) * 60}ms;
  ${hareketsiz}
`;

export const KartBaslik = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  min-width: 0;
  h2,
  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral800};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  span.ek {
    margin-left: auto;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    white-space: nowrap;
  }
`;

export const IkonKutu = styled.span`
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: ${({ $boy }) => $boy || 36}px;
  height: ${({ $boy }) => $boy || 36}px;
  border-radius: ${({ $boy }) => Math.round(($boy || 36) / 3.2)}px;
  background: ${({ $renk }) => `${$renk || '#2dd4bf'}1f`};
  color: ${({ $renk }) => $renk || '#2dd4bf'};
  svg {
    width: ${({ $boy }) => Math.round(($boy || 36) * 0.5)}px;
    height: ${({ $boy }) => Math.round(($boy || 36) * 0.5)}px;
  }
  svg path {
    fill: currentColor;
  }
`;

export const Izgara = styled.div`
  display: grid;
  gap: ${({ $bosluk }) => $bosluk || 20}px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, ${({ $min }) => $min || 220}px), 1fr));
  min-width: 0;
`;

export const Nabiz = styled.span`
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2dd4bf;
  animation: ${nabiz} 1.8s infinite;
  flex-shrink: 0;
  ${hareketsiz}
`;

const DegisimSpan = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $iyi }) => ($iyi == null ? '#9fb0c2' : $iyi ? '#34d399' : '#f87171')};
  background: ${({ $iyi }) => ($iyi == null ? 'rgba(159,176,194,.12)' : $iyi ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)')};
`;

export const Degisim = ({ yuzde, ters = false }) => {
  if (yuzde == null) return <DegisimSpan $iyi={null}>yeni</DegisimSpan>;
  const r = Math.round(yuzde);
  if (r === 0) return <DegisimSpan $iyi={null}>→ %0</DegisimSpan>;
  const iyi = ters ? r < 0 : r > 0;
  return (
    <DegisimSpan $iyi={iyi} title="Önceki eş döneme göre">
      {r > 0 ? '▲' : '▼'} %{Math.abs(r)}
    </DegisimSpan>
  );
};

const KpiKutu = styled(Kart)`
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  .etiket {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral500};
    font-weight: 600;
  }
  .deger {
    margin: 10px 0 6px;
    font-size: 28px;
    line-height: 1.1;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.neutral900};
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .alt {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    flex-wrap: wrap;
  }
  &::after {
    content: '';
    position: absolute;
    right: -30px;
    top: -30px;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: ${({ $renk }) => `${$renk || '#2dd4bf'}14`};
  }
`;

export const Kpi = ({ etiket, deger, bicim = sayi, ikon: Ikon, renk, yuzde, ters, alt, gecikme }) => {
  const d = useSayac(deger);
  return (
    <KpiKutu $renk={renk} $gecikme={gecikme}>
      <div className="etiket">
        {Ikon && (
          <IkonKutu $boy={28} $renk={renk}>
            <Ikon />
          </IkonKutu>
        )}
        {etiket}
      </div>
      <div className="deger">{bicim(d)}</div>
      <div className="alt">
        {yuzde !== undefined && <Degisim yuzde={yuzde} ters={ters} />}
        {alt}
      </div>
    </KpiKutu>
  );
};

const GrafikKutu = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  svg {
    display: block;
    overflow: visible;
  }
  .cizgi {
    stroke-dasharray: var(--uz);
    animation: ${ciz} 1.2s ease-out both;
    ${hareketsiz}
  }
  .alan {
    animation: ${belir} 1.2s ease-out both;
    ${hareketsiz}
  }
  .ipucu {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    pointer-events: none;
    background: #0b1017;
    border: 1px solid #2e3b4b;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12px;
    color: #e8eef5;
    white-space: nowrap;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    z-index: 2;
  }
  .ipucu b {
    display: block;
    margin-bottom: 4px;
    color: #9fb0c2;
    font-weight: 600;
  }
  .ipucu i {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }
`;

const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const xEtiket = (x, birim) => {
  const [t, s] = String(x).split(' ');
  if (birim === 'hour') return (s || '').slice(0, 5);
  const [, a, g] = t.split('-');
  return `${Number(g)} ${AYLAR[Number(a) - 1] || ''}`;
};

const yolOlustur = (noktalar) => noktalar.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

export const AlanGrafik = ({ seriler, yukseklik = 220, birim = 'day', eksen = true }) => {
  const kutu = React.useRef(null);
  const [en, setEn] = React.useState(0);
  const [imlec, setImlec] = React.useState(null);
  const kimlik = React.useId().replace(/:/g, '');
  React.useLayoutEffect(() => {
    const el = kutu.current;
    if (!el) return undefined;
    const g = () => setEn(el.clientWidth);
    g();
    const ro = new ResizeObserver(g);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = seriler[0]?.veri.length || 0;
  const sol = eksen ? 36 : 4;
  const alt = eksen ? 24 : 4;
  const ust = 10;
  const w = Math.max(0, en - sol - 4);
  const h = yukseklik - alt - ust;
  const enBuyuk = Math.max(1, ...seriler.flatMap((s) => s.veri.map((v) => v.y)));
  const tavan = Math.ceil(enBuyuk / 4) * 4 || 4;
  const px = (i) => sol + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const py = (y) => ust + h - (y / tavan) * h;
  const adim = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 70))));
  const hareket = (e) => {
    const r = kutu.current.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - sol) / (w || 1)) * (n - 1));
    setImlec(i >= 0 && i < n ? i : null);
  };
  return (
    <GrafikKutu ref={kutu} style={{ height: yukseklik }} onMouseMove={hareket} onMouseLeave={() => setImlec(null)}>
      {en > 0 && n > 0 && (
        <svg width={en} height={yukseklik} role="img" aria-label="Zaman grafiği">
          <defs>
            {seriler.map((s, si) => (
              <linearGradient key={si} id={`g${kimlik}${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.renk} stopOpacity="0.35" />
                <stop offset="100%" stopColor={s.renk} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {eksen &&
            [0, 1, 2, 3, 4].map((k) => {
              const y = ust + (h / 4) * k;
              return (
                <g key={k}>
                  <line x1={sol} x2={sol + w} y1={y} y2={y} stroke="#232e3b" strokeDasharray="3 5" />
                  <text x={sol - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7d91">
                    {sayi(tavan - (tavan / 4) * k)}
                  </text>
                </g>
              );
            })}
          {eksen &&
            seriler[0].veri.map((v, i) =>
              i % adim === 0 ? (
                <text key={i} x={px(i)} y={yukseklik - 6} textAnchor="middle" fontSize="11" fill="#6b7d91">
                  {xEtiket(v.x, birim)}
                </text>
              ) : null
            )}
          {seriler.map((s, si) => {
            const nk = s.veri.map((v, i) => [px(i), py(v.y)]);
            const cizgi = yolOlustur(nk);
            const uz = Math.ceil(nk.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - nk[i - 1][0], p[1] - nk[i - 1][1]) : 0), 0)) + 10;
            return (
              <g key={`${si}-${n}-${en}`}>
                <path className="alan" d={`${cizgi} L${px(n - 1)} ${ust + h} L${px(0)} ${ust + h} Z`} fill={`url(#g${kimlik}${si})`} />
                <path className="cizgi" style={{ '--uz': uz }} d={cizgi} fill="none" stroke={s.renk} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
          {imlec != null && (
            <g>
              <line x1={px(imlec)} x2={px(imlec)} y1={ust} y2={ust + h} stroke="#3d4d60" />
              {seriler.map((s, si) => (
                <circle key={si} cx={px(imlec)} cy={py(s.veri[imlec].y)} r="4.5" fill="#0b1017" stroke={s.renk} strokeWidth="2.5" />
              ))}
            </g>
          )}
        </svg>
      )}
      {imlec != null && seriler[0]?.veri[imlec] && (
        <div className="ipucu" style={{ left: Math.min(Math.max(px(imlec), 80), en - 80) }}>
          <b>{xEtiket(seriler[0].veri[imlec].x, birim)}</b>
          {seriler.map((s, si) => (
            <div key={si}>
              <i style={{ background: s.renk }} />
              {s.ad}: <strong>{sayi(s.veri[imlec].y)}</strong>
            </div>
          ))}
        </div>
      )}
    </GrafikKutu>
  );
};

const CubukKutu = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  li {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral700};
    min-width: 0;
    overflow: hidden;
  }
  li .bar {
    position: absolute;
    inset: 0 auto 0 0;
    background: ${({ $renk }) => `${$renk || '#2dd4bf'}1c`};
    border-radius: 8px;
    transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
    ${hareketsiz}
  }
  li .ad {
    position: relative;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li .n {
    position: relative;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral800};
    font-variant-numeric: tabular-nums;
  }
`;

export const CubukListe = ({ ogeler, ad = (o) => o.x, renk, bos = 'Bu dönemde veri yok.' }) => {
  const [hazir, setHazir] = React.useState(false);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setHazir(true));
    return () => cancelAnimationFrame(t);
  }, [ogeler]);
  if (!ogeler?.length) return <BosDurum kucuk metin={bos} />;
  const enBuyuk = Math.max(...ogeler.map((o) => o.y), 1);
  return (
    <CubukKutu $renk={renk}>
      {ogeler.map((o, i) => (
        <li key={`${o.x}-${i}`} title={typeof ad(o) === 'string' ? ad(o) : undefined}>
          <span className="bar" style={{ width: hazir ? `${(o.y / enBuyuk) * 100}%` : 0 }} />
          <span className="ad">{ad(o)}</span>
          <span className="n">{sayi(o.y)}</span>
        </li>
      ))}
    </CubukKutu>
  );
};

const HalkaKutu = styled.div`
  position: relative;
  width: ${({ $boy }) => $boy}px;
  height: ${({ $boy }) => $boy}px;
  flex-shrink: 0;
  circle.on {
    transition: stroke-dashoffset 1.1s cubic-bezier(0.2, 0.8, 0.2, 1);
    ${hareketsiz}
  }
  .orta {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    line-height: 1.2;
  }
  .orta b {
    display: block;
    font-size: 20px;
    color: ${({ theme }) => theme.colors.neutral900};
  }
`;

export const Halka = ({ oran, boy = 96, renk = '#2dd4bf', ust, alt }) => {
  const [o, setO] = React.useState(0);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setO(Math.max(0, Math.min(1, oran || 0))));
    return () => cancelAnimationFrame(t);
  }, [oran]);
  const r = boy / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <HalkaKutu $boy={boy}>
      <svg width={boy} height={boy} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={boy / 2} cy={boy / 2} r={r} fill="none" stroke="#232e3b" strokeWidth="9" />
        <circle className="on" cx={boy / 2} cy={boy / 2} r={r} fill="none" stroke={renk} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - o)} />
      </svg>
      <div className="orta">
        <div>
          <b>{ust}</b>
          {alt}
        </div>
      </div>
    </HalkaKutu>
  );
};

const BosKutu = styled.div`
  display: grid;
  place-items: center;
  text-align: center;
  gap: 8px;
  padding: ${({ $kucuk }) => ($kucuk ? '18px 8px' : '48px 16px')};
  color: ${({ theme }) => theme.colors.neutral500};
  font-size: 14px;
  svg {
    width: 36px;
    height: 36px;
    opacity: 0.6;
  }
`;

export const BosDurum = ({ metin, ikon: Ikon, kucuk }) => (
  <BosKutu $kucuk={kucuk}>
    {Ikon && <Ikon />}
    <span>{metin}</span>
  </BosKutu>
);

const Dondur = styled.span`
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid #232e3b;
  border-top-color: #2dd4bf;
  animation: ${donme} 0.8s linear infinite;
`;

export const Yukleniyor = ({ metin = 'Yükleniyor…' }) => (
  <BosKutu $kucuk>
    <Dondur />
    <span>{metin}</span>
  </BosKutu>
);

export const HataKutu = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #fca5a5;
  font-size: 14px;
`;

export const Secici = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.neutral100};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  button {
    appearance: none;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral600};
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  button:hover {
    color: ${({ theme }) => theme.colors.neutral900};
  }
  button[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.neutral0};
    color: ${({ theme }) => theme.colors.neutral900};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }
  button .rozet {
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 999px;
    background: #184444;
    color: #5eead4;
  }
`;

export const Rozet = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $renk }) => $renk || '#5eead4'};
  background: ${({ $renk }) => `${$renk || '#5eead4'}1c`};
`;

const renkler = ['#2dd4bf', '#60a5fa', '#a78bfa', '#f59e0b', '#f472b6', '#34d399', '#fb7185', '#38bdf8'];
export const adRengi = (s) => renkler[[...String(s || '')].reduce((t, c) => t + c.charCodeAt(0), 0) % renkler.length];
export const basHarfler = (ad) =>
  String(ad || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase('tr'))
    .join('');

export const Avatar = styled.span`
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: ${({ $boy }) => $boy || 38}px;
  height: ${({ $boy }) => $boy || 38}px;
  border-radius: 50%;
  font-size: ${({ $boy }) => Math.round(($boy || 38) * 0.38)}px;
  font-weight: 800;
  color: #0b1017;
  background: ${({ $renk }) => $renk};
`;

const ulkeAdlari = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['tr'], { type: 'region' }) : null;
export const ulke = (kod) => {
  const k = String(kod || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(k)) return kod || 'Bilinmiyor';
  const bayrak = String.fromCodePoint(...[...k].map((c) => 127397 + c.charCodeAt(0)));
  let ad = k;
  try {
    ad = ulkeAdlari?.of(k) || k;
  } catch {}
  return `${bayrak}  ${ad}`;
};

const TARAYICI = { chrome: 'Chrome', crios: 'Chrome (iOS)', ios: 'Safari (iOS)', safari: 'Safari', firefox: 'Firefox', fxios: 'Firefox (iOS)', 'edge-chromium': 'Edge', edge: 'Edge', 'edge-ios': 'Edge (iOS)', opera: 'Opera', samsung: 'Samsung Internet', 'android-webview': 'Android WebView', 'ios-webview': 'iOS WebView', yandexbrowser: 'Yandex', facebook: 'Facebook', instagram: 'Instagram' };
export const tarayici = (x) => TARAYICI[x] || x || 'Bilinmiyor';
const CIHAZ = { desktop: 'Masaüstü', laptop: 'Dizüstü', mobile: 'Mobil', tablet: 'Tablet' };
export const cihaz = (x) => CIHAZ[x] || x || 'Bilinmiyor';
export const sayfaAdi = (x) => (x === '/' ? 'Ana sayfa  /' : x || '-');
export const kaynakAdi = (x) => x || 'Doğrudan / bilinmiyor';
