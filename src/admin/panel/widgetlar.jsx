import * as React from 'react';
import { styled } from 'styled-components';
import { Link } from 'react-router-dom';
import { Message } from '@strapi/icons';
import { AlanGrafik, Halka, Degisim, Nabiz, Yukleniyor, HataKutu, BosDurum, Avatar, Rozet, IkonKutu, useVeri, useSayac, sayi, degisim, zamanOnce, adRengi, basHarfler } from './ui';
import { KISAYOLLAR } from './bolumler';

const Kutu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-width: 0;
`;

const Satir = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 18px;
  flex-wrap: wrap;
  .kpi small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    font-weight: 600;
  }
  .kpi b {
    display: inline-block;
    font-size: 26px;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.neutral900};
    font-variant-numeric: tabular-nums;
    margin-right: 8px;
    letter-spacing: -0.02em;
  }
  .anlik {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #99f6e4;
    background: #112d2f;
    border: 1px solid #184444;
    padding: 6px 12px;
    border-radius: 999px;
  }
`;

const SayacB = ({ n }) => <b>{sayi(useSayac(n))}</b>;

export function TrafikWidget() {
  const { veri, hata } = useVeri('/swb-panel/istatistik?aralik=7g', [], 60000);
  if (hata && !veri) return <HataKutu>{hata}</HataKutu>;
  if (!veri) return <Yukleniyor />;
  const o = veri.ozet;
  return (
    <Kutu>
      <Satir>
        <div className="kpi">
          <small>Son 7 günde ziyaretçi</small>
          <SayacB n={o.visitors.deger} />
          <Degisim yuzde={degisim(o.visitors.deger, o.visitors.onceki)} />
        </div>
        <div className="kpi">
          <small>Görüntüleme</small>
          <SayacB n={o.pageviews.deger} />
          <Degisim yuzde={degisim(o.pageviews.deger, o.pageviews.onceki)} />
        </div>
        <span className="anlik">
          <Nabiz /> {sayi(veri.aktif)} kişi çevrim içi
        </span>
      </Satir>
      <AlanGrafik yukseklik={165} birim={veri.birim} seriler={[{ ad: 'Görüntüleme', renk: '#2dd4bf', veri: veri.seri.goruntuleme }]} />
    </Kutu>
  );
}

const MesajListe = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
  li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 8px;
    border-radius: 10px;
    text-decoration: none;
    min-width: 0;
    transition: background 0.15s;
  }
  li a:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
  .g {
    flex: 1;
    min-width: 0;
  }
  .ad {
    display: block;
    font-size: 13.5px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral800};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .oz {
    display: block;
    font-size: 12.5px;
    color: ${({ theme }) => theme.colors.neutral500};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .z {
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.neutral500};
    white-space: nowrap;
  }
`;

export function MesajWidget() {
  const { veri, hata } = useVeri('/swb-panel/ozet', [], 30000);
  if (hata && !veri) return <HataKutu>{hata}</HataKutu>;
  if (!veri) return <Yukleniyor />;
  const m = veri.mesaj;
  return (
    <Kutu>
      <div style={{ fontSize: 13, color: '#9fb0c2' }}>
        {m.yeni ? <b style={{ color: '#5eead4' }}>{m.yeni} okunmamış mesaj</b> : 'Okunmamış mesaj yok'}, toplam {m.toplam}
      </div>
      {!m.son.length ? (
        <BosDurum kucuk ikon={Message} metin="Henüz mesaj yok. İletişim formundan gelenler burada görünür." />
      ) : (
        <MesajListe>
          {m.son.slice(0, 4).map((x) => (
            <li key={x.id}>
              <Link to={`/mesajlar?id=${x.id}`}>
                <Avatar $boy={32} $renk={adRengi(x.ad)}>
                  {basHarfler(x.ad)}
                </Avatar>
                <span className="g">
                  <span className="ad">
                    {x.ad}
                    {x.durum === 'yeni' && <span style={{ color: '#2dd4bf', fontWeight: 600 }}> (yeni)</span>}
                  </span>
                  <span className="oz">{x.konuAdi || x.konu}: {x.mesaj}</span>
                </span>
                <span className="z">{zamanOnce(x.createdAt)}</span>
              </Link>
            </li>
          ))}
        </MesajListe>
      )}
    </Kutu>
  );
}

const Iki = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 14px;
  .blok {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-radius: 14px;
    background: ${({ theme }) => theme.colors.neutral100};
    min-width: 0;
  }
  h4 {
    margin: 0 0 6px;
    font-size: 13.5px;
    color: ${({ theme }) => theme.colors.neutral800};
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  dl {
    margin: 0;
    display: grid;
    grid-template-columns: auto auto;
    gap: 3px 12px;
    font-size: 12.5px;
  }
  dt {
    color: ${({ theme }) => theme.colors.neutral500};
  }
  dd {
    margin: 0;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral800};
    text-align: right;
  }
`;

export function PazarlamaWidget() {
  const { veri, hata } = useVeri('/swb-panel/ozet', [], 60000);
  if (hata && !veri) return <HataKutu>{hata}</HataKutu>;
  if (!veri) return <Yukleniyor />;
  const c = veri.cark;
  const a = veri.abone;
  const toplamAbone = a.aktif + a.beklemede;
  return (
    <Iki>
      <div className="blok">
        <Halka oran={c.kuponToplam ? c.kuponKalan / c.kuponToplam : 0} boy={86} renk="#f59e0b" ust={c.kuponKalan} alt="kupon" />
        <div style={{ minWidth: 0 }}>
          <h4>
            Çark <Rozet $renk={c.aktif ? '#34d399' : '#9fb0c2'}>{c.aktif ? 'açık' : 'kapalı'}</Rozet>
          </h4>
          <dl>
            <dt>Bugün</dt>
            <dd>{sayi(c.katilimGun)} çevirme</dd>
            <dt>Bu dönem</dt>
            <dd>{sayi(c.katilimDonem)} çevirme</dd>
            <dt>Kazanan</dt>
            <dd>{sayi(c.kazanan)}</dd>
          </dl>
        </div>
      </div>
      <div className="blok">
        <Halka oran={toplamAbone ? a.aktif / toplamAbone : 0} boy={86} renk="#a78bfa" ust={a.aktif} alt="abone" />
        <div style={{ minWidth: 0 }}>
          <h4>
            Bülten <Rozet $renk={a.formlarAcik ? '#34d399' : '#9fb0c2'}>{a.formlarAcik ? 'formlar açık' : 'formlar kapalı'}</Rozet>
          </h4>
          <dl>
            <dt>Onay bekleyen</dt>
            <dd>{sayi(a.beklemede)}</dd>
            <dt>Bu hafta yeni</dt>
            <dd>{sayi(a.yeni)}</dd>
            <dt>Ayrılan</dt>
            <dd>{sayi(a.iptal)}</dd>
          </dl>
        </div>
      </div>
    </Iki>
  );
}

const Karolar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 10px;
  a {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border-radius: 14px;
    text-decoration: none;
    background: ${({ theme }) => theme.colors.neutral100};
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral800};
    transition: transform 0.18s ease, border-color 0.18s ease;
  }
  a:hover,
  a:focus-visible {
    transform: translateY(-2px);
    border-color: #2e3b4b;
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
    a:hover {
      transform: none;
    }
  }
`;

export function KisayolWidget() {
  return (
    <Karolar>
      {KISAYOLLAR.map((k) => (
        <Link key={k.ad} to={k.yol}>
          <IkonKutu $boy={34}>
            <k.ikon />
          </IkonKutu>
          {k.ad}
        </Link>
      ))}
    </Karolar>
  );
}

