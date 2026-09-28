import * as React from 'react';
import { styled } from 'styled-components';
import ILLER from './turkiye.json';
import { sayi, sureYaz, useVeri, CubukListe, Yukleniyor, HataKutu, sayfaAdi, kaynakAdi, cihaz } from './ui';

const ADLAR = Object.fromEntries(ILLER.map((i) => [i.p, i.ad]));
const OLCEK = ['#123b3b', '#155e59', '#0f766e', '#14b8a6', '#2dd4bf', '#99f6e4'];
const BOS = '#1a222d';

const Kutu = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  path {
    stroke: #0b1017;
    stroke-width: 0.8;
    cursor: pointer;
    transition: fill 0.5s ease, opacity 0.2s ease;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
  path:focus {
    outline: none;
  }
  path.secili {
    stroke: #f3f6fa;
    stroke-width: 2;
  }
  path.ustunde {
    stroke: #e8eef5;
    stroke-width: 1.6;
  }
  .ipucu {
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, calc(-100% - 12px));
    background: #0b1017;
    border: 1px solid #2e3b4b;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12.5px;
    color: #c9d4e0;
    white-space: nowrap;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
    z-index: 3;
  }
  .ipucu b {
    display: block;
    color: #f3f6fa;
    font-size: 14px;
    margin-bottom: 2px;
  }
`;

const Lejant = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral500};
  flex-wrap: wrap;
  .serit {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    width: 180px;
    max-width: 50%;
  }
  .serit span {
    flex: 1;
  }
`;

export const TurkiyeHaritasi = ({ iller, secili, sec }) => {
  const kutu = React.useRef(null);
  const [ustunde, setUstunde] = React.useState(null);
  const [konum, setKonum] = React.useState(null);
  const [hazir, setHazir] = React.useState(false);
  const deger = React.useMemo(() => Object.fromEntries((iller || []).map((i) => [i.plaka, i.y])), [iller]);
  const toplam = (iller || []).reduce((t, i) => t + i.y, 0) || 1;
  const enBuyuk = Math.max(1, ...(iller || []).map((i) => i.y));
  React.useEffect(() => {
    setHazir(false);
    const t = setTimeout(() => setHazir(true), 60);
    return () => clearTimeout(t);
  }, [iller]);
  const renk = (p) => {
    const v = deger[p];
    if (!v || !hazir) return BOS;
    const oran = Math.sqrt(v / enBuyuk);
    return OLCEK[Math.min(OLCEK.length - 1, Math.floor(oran * OLCEK.length))];
  };
  const hareket = (e, p) => {
    const r = kutu.current.getBoundingClientRect();
    setUstunde(p);
    setKonum({ x: Math.min(Math.max(e.clientX - r.left, 70), r.width - 70), y: e.clientY - r.top });
  };
  return (
    <Kutu ref={kutu} onMouseLeave={() => setUstunde(null)}>
      <svg viewBox="16 138 1020 456" role="img" aria-label="İllere göre ziyaretçi haritası">
        {ILLER.map((il) => (
          <path
            key={il.p}
            d={il.d}
            fill={renk(il.p)}
            className={secili === il.p ? 'secili' : ustunde === il.p ? 'ustunde' : ''}
            opacity={secili && secili !== il.p && ustunde !== il.p ? 0.78 : 1}
            onMouseMove={(e) => hareket(e, il.p)}
            onClick={() => sec(il.p)}
            aria-label={`${il.ad}: ${sayi(deger[il.p] || 0)} ziyaretçi`}
          />
        ))}
      </svg>
      {ustunde && konum && (
        <div className="ipucu" style={{ left: konum.x, top: konum.y }}>
          <b>{ADLAR[ustunde]}</b>
          {deger[ustunde] ? `${sayi(deger[ustunde])} ziyaretçi · %${((deger[ustunde] / toplam) * 100).toFixed(1).replace('.', ',')}` : 'Bu dönemde ziyaret yok'}
        </div>
      )}
      <Lejant>
        <span>Az</span>
        <span className="serit">
          {OLCEK.map((r) => (
            <span key={r} style={{ background: r }} />
          ))}
        </span>
        <span>Çok</span>
        <span style={{ marginLeft: 'auto' }}>Bir ile tıklayarak ayrıntısını görün</span>
      </Lejant>
    </Kutu>
  );
};

const Detay = styled.div`
  min-width: 0;
  h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.neutral900};
  }
  .alt {
    margin-top: 4px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  .rakamlar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 16px 0 18px;
  }
  .rakam {
    padding: 12px 14px;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.neutral100};
  }
  .rakam small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  .rakam b {
    font-size: 19px;
    color: ${({ theme }) => theme.colors.neutral900};
    font-variant-numeric: tabular-nums;
  }
  h4 {
    margin: 18px 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral600};
  }
`;

export const IlDetay = ({ plaka, aralik, iller }) => {
  const { veri, hata, yukleniyor } = useVeri(`/swb-panel/istatistik/il?kod=TR-${String(plaka).padStart(2, '0')}&aralik=${aralik}`);
  const sira = (iller || []).findIndex((i) => i.plaka === plaka) + 1;
  const toplam = (iller || []).reduce((t, i) => t + i.y, 0) || 1;
  const ilDeger = (iller || []).find((i) => i.plaka === plaka)?.y || 0;
  const o = veri?.ozet;
  return (
    <Detay>
      <h3>{ADLAR[plaka]}</h3>
      <div className="alt">{sira ? `İller arasında ${sira}. sırada · Türkiye trafiğindeki payı %${((ilDeger / toplam) * 100).toFixed(1).replace('.', ',')}` : 'Bu dönemde ziyaret yok'}</div>
      {hata && !veri && (
        <div style={{ marginTop: 14 }}>
          <HataKutu>{hata}</HataKutu>
        </div>
      )}
      {!veri && yukleniyor && <Yukleniyor />}
      {o && (
        <div style={{ opacity: yukleniyor ? 0.6 : 1, transition: 'opacity .2s' }}>
          <div className="rakamlar">
            <div className="rakam">
              <small>Ziyaretçi</small>
              <b>{sayi(o.visitors)}</b>
            </div>
            <div className="rakam">
              <small>Sayfa görüntüleme</small>
              <b>{sayi(o.pageviews)}</b>
            </div>
            <div className="rakam">
              <small>Ziyaret</small>
              <b>{sayi(o.visits)}</b>
            </div>
            <div className="rakam">
              <small>Ort. süre</small>
              <b>{sureYaz(o.visits ? o.totaltime / o.visits : 0)}</b>
            </div>
          </div>
          <h4>İlçe / şehir</h4>
          <CubukListe ogeler={veri.ilceler} renk="#2dd4bf" />
          <h4>En çok bakılan sayfalar</h4>
          <CubukListe ogeler={veri.sayfalar} ad={(x) => sayfaAdi(x.x)} renk="#60a5fa" />
          <h4>Nereden geldiler</h4>
          <CubukListe ogeler={veri.kaynaklar} ad={(x) => kaynakAdi(x.x)} renk="#a78bfa" />
          <h4>Cihaz</h4>
          <CubukListe ogeler={veri.cihazlar} ad={(x) => cihaz(x.x)} renk="#f59e0b" />
        </div>
      )}
    </Detay>
  );
};

export const ilAdi = (p) => ADLAR[p] || p;
