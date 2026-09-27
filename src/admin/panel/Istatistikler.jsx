import * as React from 'react';
import { styled } from 'styled-components';
import { Layouts, Page } from '@strapi/strapi/admin';
import { Main } from '@strapi/design-system';
import { User, Eye, Cursor, ArrowLeft, Clock, File, Link as LinkIkon, Earth, PinMap, Monitor, Command, Television, ExternalLink, ChartPie } from '@strapi/icons';
import { Sayfa, Kart, KartBaslik, IkonKutu, Izgara, Kpi, AlanGrafik, CubukListe, Secici, Nabiz, Yukleniyor, HataKutu, sayi, sureYaz, degisim, useVeri, ulke, tarayici, cihaz, sayfaAdi, kaynakAdi } from './ui';

const ARALIKLAR = [
  ['gun', 'Son 24 saat'],
  ['7g', 'Son 7 gün'],
  ['30g', 'Son 30 gün'],
  ['90g', 'Son 90 gün'],
];

const Ust = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-bottom: 24px;
  .anlik {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    border-radius: 12px;
    background: #112d2f;
    border: 1px solid #184444;
    color: #99f6e4;
    font-size: 14px;
    font-weight: 600;
  }
  .anlik b {
    font-size: 18px;
    color: #f3f6fa;
  }
  a.rapor {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #2dd4bf;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }
  a.rapor svg {
    width: 14px;
    height: 14px;
  }
  a.rapor svg path {
    fill: currentColor;
  }
`;

const Lejant = styled.div`
  display: flex;
  gap: 16px;
  margin-left: auto;
  font-size: 12px;
  color: #9fb0c2;
  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
  }
`;

const ListeKarti = ({ baslik, ikon: Ikon, renk, ogeler, ad, gecikme }) => (
  <Kart $gecikme={gecikme}>
    <KartBaslik>
      <IkonKutu $renk={renk} $boy={32}>
        <Ikon />
      </IkonKutu>
      <h3>{baslik}</h3>
    </KartBaslik>
    <CubukListe ogeler={ogeler} ad={ad} renk={renk} />
  </Kart>
);

export default function Istatistikler() {
  const [aralik, setAralik] = React.useState(() => {
    try {
      return sessionStorage.getItem('swb_ist_aralik') || '7g';
    } catch {
      return '7g';
    }
  });
  const { veri, hata, yukleniyor } = useVeri(`/swb-panel/istatistik?aralik=${aralik}`, [], 60000);
  const sec = (a) => {
    setAralik(a);
    try {
      sessionStorage.setItem('swb_ist_aralik', a);
    } catch {}
  };
  const o = veri?.ozet;
  const ziyaret = o?.visits.deger || 0;
  const hemenCikma = ziyaret ? (o.bounces.deger / ziyaret) * 100 : 0;
  const oncekiHemen = o?.visits.onceki ? (o.bounces.onceki / o.visits.onceki) * 100 : 0;
  const ortSure = ziyaret ? o.totaltime.deger / ziyaret : 0;
  const oncekiSure = o?.visits.onceki ? o.totaltime.onceki / o.visits.onceki : 0;
  const L = veri?.listeler || {};

  return (
    <Layouts.Root>
      <Main>
      <Page.Title>İstatistikler</Page.Title>
      <Layouts.Header title="İstatistikler" subtitle="sunucumweb.com ziyaretçi verileri (YetkinWeb İstatistik). Veriler dakikada bir yenilenir." />
      <Sayfa>
        <Ust>
          <Secici role="group" aria-label="Dönem">
            {ARALIKLAR.map(([k, ad]) => (
              <button key={k} type="button" aria-pressed={aralik === k} onClick={() => sec(k)}>
                {ad}
              </button>
            ))}
          </Secici>
          {veri && (
            <span className="anlik" title="Son 5 dakikada sitede olanlar">
              <Nabiz /> Şu an sitede <b>{sayi(veri.aktif)}</b> kişi
            </span>
          )}
          {veri?.raporAdresi && (
            <a className="rapor" href={veri.raporAdresi} target="_blank" rel="noopener noreferrer">
              Ayrıntılı rapor <ExternalLink />
            </a>
          )}
        </Ust>

        {hata && !veri && <HataKutu>{hata}</HataKutu>}
        {!veri && yukleniyor && <Yukleniyor metin="İstatistikler getiriliyor…" />}

        {o && (
          <div key={veri.aralik} style={{ display: 'grid', gap: 20, opacity: yukleniyor ? 0.6 : 1, transition: 'opacity .2s' }}>
            <Izgara $min={190} $bosluk={16}>
              <Kpi gecikme={0} etiket="Ziyaretçi" ikon={User} renk="#2dd4bf" deger={o.visitors.deger} yuzde={degisim(o.visitors.deger, o.visitors.onceki)} alt="tekil kişi" />
              <Kpi gecikme={1} etiket="Sayfa görüntüleme" ikon={Eye} renk="#60a5fa" deger={o.pageviews.deger} yuzde={degisim(o.pageviews.deger, o.pageviews.onceki)} />
              <Kpi gecikme={2} etiket="Ziyaret" ikon={Cursor} renk="#a78bfa" deger={o.visits.deger} yuzde={degisim(o.visits.deger, o.visits.onceki)} />
              <Kpi gecikme={3} etiket="Hemen çıkma" ikon={ArrowLeft} renk="#f59e0b" deger={hemenCikma} bicim={(d) => `%${Math.round(d)}`} yuzde={degisim(hemenCikma, oncekiHemen)} ters />
              <Kpi gecikme={4} etiket="Ort. ziyaret süresi" ikon={Clock} renk="#f472b6" deger={ortSure} bicim={sureYaz} yuzde={degisim(ortSure, oncekiSure)} />
            </Izgara>

            <Kart $gecikme={2}>
              <KartBaslik>
                <IkonKutu $boy={32}>
                  <ChartPie />
                </IkonKutu>
                <h2>Trafik grafiği</h2>
                <Lejant>
                  <span>
                    <i style={{ background: '#2dd4bf' }} /> Görüntüleme
                  </span>
                  <span>
                    <i style={{ background: '#a78bfa' }} /> Ziyaret
                  </span>
                </Lejant>
              </KartBaslik>
              <AlanGrafik
                yukseklik={280}
                birim={veri.birim}
                seriler={[
                  { ad: 'Görüntüleme', renk: '#2dd4bf', veri: veri.seri.goruntuleme },
                  { ad: 'Ziyaret', renk: '#a78bfa', veri: veri.seri.ziyaret },
                ]}
              />
            </Kart>

            <Izgara $min={320}>
              <ListeKarti gecikme={3} baslik="En çok görüntülenen sayfalar" ikon={File} renk="#2dd4bf" ogeler={L.sayfalar} ad={(x) => sayfaAdi(x.x)} />
              <ListeKarti gecikme={4} baslik="Ziyaretçilerin geldiği yerler" ikon={LinkIkon} renk="#60a5fa" ogeler={L.kaynaklar} ad={(x) => kaynakAdi(x.x)} />
              <ListeKarti gecikme={5} baslik="Ülkeler" ikon={Earth} renk="#a78bfa" ogeler={L.ulkeler} ad={(x) => ulke(x.x)} />
              <ListeKarti gecikme={6} baslik="Şehirler" ikon={PinMap} renk="#f472b6" ogeler={L.sehirler} ad={(x) => (x.country ? `${x.x} · ${x.country}` : x.x)} />
              <ListeKarti gecikme={7} baslik="Giriş sayfaları" ikon={Cursor} renk="#34d399" ogeler={L.girisler} ad={(x) => sayfaAdi(x.x)} />
              <ListeKarti gecikme={8} baslik="Tarayıcılar" ikon={Monitor} renk="#f59e0b" ogeler={L.tarayicilar} ad={(x) => tarayici(x.x)} />
              <ListeKarti gecikme={9} baslik="İşletim sistemleri" ikon={Command} renk="#38bdf8" ogeler={L.sistemler} ad={(x) => x.x || 'Bilinmiyor'} />
              <ListeKarti gecikme={10} baslik="Cihazlar" ikon={Television} renk="#fb7185" ogeler={L.cihazlar} ad={(x) => cihaz(x.x)} />
            </Izgara>
          </div>
        )}
      </Sayfa>
      </Main>
    </Layouts.Root>
  );
}
