import * as React from 'react';
import { styled } from 'styled-components';
import { Layouts, Page } from '@strapi/strapi/admin';
import { Main } from '@strapi/design-system';
import { User, Eye, Cursor, ArrowLeft, Clock, File, Link as LinkIkon, Earth, Monitor, Command, Television, ExternalLink, ChartPie, PinMap, Calendar } from '@strapi/icons';
import { Sayfa, Kart, KartBaslik, IkonKutu, Izgara, Kpi, AlanGrafik, CubukListe, Pasta, IsiHaritasi, Secici, Nabiz, Yukleniyor, HataKutu, sayi, sureYaz, degisim, useVeri, ulke, tarayici, cihaz, sayfaAdi, kaynakAdi } from './ui';
import { TurkiyeHaritasi, IlDetay, ilAdi } from './harita';

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
  gap: 12px 16px;
  margin-bottom: 24px;
  .anlik {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.neutral150};
    background: ${({ theme }) => theme.colors.neutral0};
    color: ${({ theme }) => theme.colors.neutral700};
    font-size: 13.5px;
  }
  .anlik b {
    color: ${({ theme }) => theme.colors.neutral900};
  }
  a.rapor {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    color: ${({ theme }) => theme.colors.neutral800};
    font-size: 13.5px;
    font-weight: 600;
    text-decoration: none;
    transition: border-color 0.15s;
  }
  a.rapor:hover {
    border-color: #14b8a6;
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
  color: ${({ theme }) => theme.colors.neutral500};
  flex-wrap: wrap;
  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  i {
    width: 14px;
    height: 3px;
    border-radius: 2px;
    display: inline-block;
  }
  i.kesik {
    background: repeating-linear-gradient(90deg, #9fb0c2 0 4px, transparent 4px 7px) !important;
  }
`;

const HaritaDuzen = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
  .yan {
    border-left: 1px solid ${({ theme }) => theme.colors.neutral150};
    padding-left: 28px;
    min-width: 0;
  }
  @media (max-width: 1100px) {
    .yan {
      border-left: 0;
      padding-left: 0;
      border-top: 1px solid ${({ theme }) => theme.colors.neutral150};
      padding-top: 22px;
    }
  }
`;

const IlListesi = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral700};
    font: inherit;
    font-size: 12.5px;
    cursor: pointer;
  }
  button b {
    color: ${({ theme }) => theme.colors.neutral900};
    font-variant-numeric: tabular-nums;
  }
  button[aria-pressed='true'] {
    border-color: #2dd4bf;
    color: #5eead4;
  }
`;

const Baslik = ({ ikon: Ikon, renk, children, ek }) => (
  <KartBaslik>
    <IkonKutu $renk={renk} $boy={32}>
      <Ikon />
    </IkonKutu>
    <h2>{children}</h2>
    {ek}
  </KartBaslik>
);

export default function Istatistikler() {
  const [aralik, setAralik] = React.useState('30g');
  const [il, setIl] = React.useState(null);
  const { veri, hata, yukleniyor } = useVeri(`/swb-panel/istatistik?aralik=${aralik}`, [], 60000);
  const iller = veri?.iller || [];
  React.useEffect(() => {
    if (!il && iller.length) setIl(iller[0].plaka);
  }, [iller, il]);
  const o = veri?.ozet;
  const ziyaret = o?.visits.deger || 0;
  const hemenCikma = ziyaret ? (o.bounces.deger / ziyaret) * 100 : 0;
  const oncekiHemen = o?.visits.onceki ? (o.bounces.onceki / o.visits.onceki) * 100 : 0;
  const ortSure = ziyaret ? o.totaltime.deger / ziyaret : 0;
  const oncekiSure = o?.visits.onceki ? o.totaltime.onceki / o.visits.onceki : 0;
  const L = veri?.listeler || {};
  const aralikAdi = ARALIKLAR.find(([k]) => k === aralik)?.[1];

  return (
    <Layouts.Root>
      <Main>
        <Page.Title>İstatistikler</Page.Title>
        <Layouts.Header title="İstatistikler" subtitle="sunucumweb.com ziyaretçi verileri. Veriler dakikada bir güncellenir." />
        <Sayfa>
          <Ust>
            <Secici role="group" aria-label="Dönem">
              {ARALIKLAR.map(([k, ad]) => (
                <button key={k} type="button" aria-pressed={aralik === k} onClick={() => setAralik(k)}>
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
            <div style={{ display: 'grid', gap: 20, opacity: yukleniyor ? 0.6 : 1, transition: 'opacity .2s' }}>
              <Izgara $min={190} $bosluk={16}>
                <Kpi gecikme={0} etiket="Ziyaretçi" ikon={User} renk="#2dd4bf" deger={o.visitors.deger} yuzde={degisim(o.visitors.deger, o.visitors.onceki)} alt="önceki döneme göre" />
                <Kpi gecikme={1} etiket="Sayfa görüntüleme" ikon={Eye} renk="#60a5fa" deger={o.pageviews.deger} yuzde={degisim(o.pageviews.deger, o.pageviews.onceki)} />
                <Kpi gecikme={2} etiket="Ziyaret" ikon={Cursor} renk="#a78bfa" deger={o.visits.deger} yuzde={degisim(o.visits.deger, o.visits.onceki)} />
                <Kpi gecikme={3} etiket="Hemen çıkma" ikon={ArrowLeft} renk="#f59e0b" deger={hemenCikma} bicim={(d) => `%${Math.round(d)}`} yuzde={degisim(hemenCikma, oncekiHemen)} ters alt="düşük olması iyi" />
                <Kpi gecikme={4} etiket="Ort. ziyaret süresi" ikon={Clock} renk="#f472b6" deger={ortSure} bicim={sureYaz} yuzde={degisim(ortSure, oncekiSure)} />
              </Izgara>

              <Kart $gecikme={1}>
                <Baslik
                  ikon={ChartPie}
                  ek={
                    <Lejant>
                      <span>
                        <i style={{ background: '#2dd4bf' }} /> Görüntüleme
                      </span>
                      <span>
                        <i style={{ background: '#a78bfa' }} /> Ziyaret
                      </span>
                      <span>
                        <i className="kesik" /> Önceki dönem
                      </span>
                    </Lejant>
                  }
                >
                  Trafik · {aralikAdi}
                </Baslik>
                <AlanGrafik
                  yukseklik={300}
                  birim={veri.birim}
                  seriler={[
                    { ad: 'Görüntüleme', renk: '#2dd4bf', veri: veri.seri.goruntuleme },
                    { ad: 'Ziyaret', renk: '#a78bfa', veri: veri.seri.ziyaret },
                    { ad: 'Önceki dönem', renk: '#9fb0c2', veri: veri.seri.onceki || [], kesikli: true },
                  ]}
                />
              </Kart>

              <Kart $gecikme={2}>
                <Baslik ikon={PinMap} renk="#2dd4bf" ek={<span className="ek">{sayi(iller.reduce((t, i) => t + i.y, 0))} ziyaretçi · {iller.length} il</span>}>
                  Türkiye'de ziyaretçiler
                </Baslik>
                <HaritaDuzen>
                  <div style={{ minWidth: 0 }}>
                    <TurkiyeHaritasi iller={iller} secili={il} sec={setIl} />
                    <IlListesi>
                      {iller.slice(0, 12).map((x) => (
                        <button key={x.plaka} type="button" aria-pressed={il === x.plaka} onClick={() => setIl(x.plaka)}>
                          {ilAdi(x.plaka)} <b>{sayi(x.y)}</b>
                        </button>
                      ))}
                    </IlListesi>
                  </div>
                  <div className="yan">{il ? <IlDetay key={`${il}-${aralik}`} plaka={il} aralik={aralik} iller={iller} /> : <span>Haritadan bir il seçin.</span>}</div>
                </HaritaDuzen>
              </Kart>

              <Kart $gecikme={3}>
                <Baslik ikon={Calendar} renk="#a78bfa">
                  Ziyaretçiler ne zaman geliyor?
                </Baslik>
                <IsiHaritasi veri={veri.haftalik} />
              </Kart>

              <Izgara $min={320}>
                <Kart $gecikme={4}>
                  <Baslik ikon={File}>En çok görüntülenen sayfalar</Baslik>
                  <CubukListe ogeler={L.sayfalar} ad={(x) => sayfaAdi(x.x)} renk="#2dd4bf" />
                </Kart>
                <Kart $gecikme={5}>
                  <Baslik ikon={LinkIkon} renk="#60a5fa">
                    Ziyaretçilerin geldiği yerler
                  </Baslik>
                  <CubukListe ogeler={L.kaynaklar} ad={(x) => kaynakAdi(x.x)} renk="#60a5fa" />
                </Kart>
                <Kart $gecikme={6}>
                  <Baslik ikon={Cursor} renk="#34d399">
                    Giriş sayfaları
                  </Baslik>
                  <CubukListe ogeler={L.girisler} ad={(x) => sayfaAdi(x.x)} renk="#34d399" />
                </Kart>
              </Izgara>

              <Izgara $min={300}>
                <Kart $gecikme={7}>
                  <Baslik ikon={Television} renk="#fb7185">
                    Cihazlar
                  </Baslik>
                  <Pasta ogeler={L.cihazlar} ad={(x) => cihaz(x.x)} />
                </Kart>
                <Kart $gecikme={8}>
                  <Baslik ikon={Monitor} renk="#f59e0b">
                    Tarayıcılar
                  </Baslik>
                  <Pasta ogeler={L.tarayicilar} ad={(x) => tarayici(x.x)} />
                </Kart>
                <Kart $gecikme={9}>
                  <Baslik ikon={Command} renk="#38bdf8">
                    İşletim sistemleri
                  </Baslik>
                  <Pasta ogeler={L.sistemler} ad={(x) => x.x || 'Bilinmiyor'} />
                </Kart>
                <Kart $gecikme={10}>
                  <Baslik ikon={Earth} renk="#a78bfa">
                    Ülkeler
                  </Baslik>
                  <CubukListe ogeler={L.ulkeler} ad={(x) => ulke(x.x)} renk="#a78bfa" />
                </Kart>
              </Izgara>
            </div>
          )}
        </Sayfa>
      </Main>
    </Layouts.Root>
  );
}
