import * as React from 'react';
import { styled } from 'styled-components';
import { Layouts, Page, useFetchClient, useNotification } from '@strapi/strapi/admin';
import { Main } from '@strapi/design-system';
import { Mail, PaperPlane, Archive, Phone, Clock, Earth, ArrowLeft, Message, Check } from '@strapi/icons';
import { Sayfa, Secici, Rozet, Avatar, adRengi, basHarfler, zamanOnce, tarihUzun, Yukleniyor, BosDurum, HataKutu, IkonKutu } from './ui';

const DURUM = {
  yeni: ['Yeni', '#2dd4bf'],
  okundu: ['Okundu', '#9fb0c2'],
  yanitlandi: ['Yanıtlandı', '#60a5fa'],
  arsiv: ['Arşivde', '#6b7d91'],
};
const FILTRELER = [
  ['acik', 'Gelen kutusu', (s) => s.toplam - s.arsiv],
  ['yeni', 'Okunmamış', (s) => s.yeni],
  ['yanitlandi', 'Yanıtlananlar', (s) => s.yanitlandi],
  ['arsiv', 'Arşiv', (s) => s.arsiv],
];

const Duzen = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  margin-top: 20px;
  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
    .liste-kutu {
      display: ${({ $detay }) => ($detay ? 'none' : 'block')};
    }
    .detay-kutu {
      display: ${({ $detay }) => ($detay ? 'block' : 'none')};
    }
  }
`;

const Liste = styled.div`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 16px;
  overflow: hidden;
  button.oge {
    appearance: none;
    display: flex;
    gap: 12px;
    width: 100%;
    text-align: left;
    padding: 16px 18px;
    border: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
    background: transparent;
    cursor: pointer;
    font: inherit;
    color: inherit;
    transition: background 0.15s;
    min-width: 0;
  }
  button.oge:last-child {
    border-bottom: 0;
  }
  button.oge:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
  button.oge[aria-current='true'] {
    background: #0f1f22;
    box-shadow: inset 3px 0 0 #2dd4bf;
  }
  .govde {
    flex: 1;
    min-width: 0;
  }
  .ust {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .ad {
    font-weight: 700;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.neutral800};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .yeni .ad::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2dd4bf;
    margin-right: 7px;
    vertical-align: middle;
  }
  .zaman {
    margin-left: auto;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    white-space: nowrap;
  }
  .konu {
    margin-top: 3px;
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.neutral700};
  }
  .ozet {
    margin-top: 3px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral500};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Detay = styled.div`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 16px;
  padding: 26px 28px;
  min-width: 0;
  @media (max-width: 640px) {
    padding: 18px;
  }
  .geri {
    display: none;
    appearance: none;
    border: 0;
    background: none;
    color: #2dd4bf;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 16px;
    align-items: center;
    gap: 6px;
  }
  .geri svg path {
    fill: currentColor;
  }
  @media (max-width: 1000px) {
    .geri {
      display: inline-flex;
    }
  }
  .kisi {
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
  }
  .kisi h2 {
    margin: 0;
    font-size: 20px;
    color: ${({ theme }) => theme.colors.neutral900};
  }
  .kisi a {
    color: #2dd4bf;
    text-decoration: none;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .eylemler {
    margin-left: auto;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .bilgiler {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
    gap: 12px;
    margin: 20px 0;
  }
  .bilgi {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.neutral100};
    min-width: 0;
  }
  .bilgi small {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  .bilgi span,
  .bilgi a {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.neutral800};
    overflow-wrap: anywhere;
    text-decoration: none;
  }
  .balon {
    padding: 18px 20px;
    border-radius: 14px;
    background: ${({ theme }) => theme.colors.neutral100};
    border: 1px solid ${({ theme }) => theme.colors.neutral150};
    font-size: 15px;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.neutral800};
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .balon.yanit {
    background: #0f1f22;
    border-color: #184444;
    margin-left: 32px;
  }
  @media (max-width: 640px) {
    .balon.yanit {
      margin-left: 12px;
    }
  }
  .balon-ust {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    margin: 18px 0 8px;
  }
  .balon-ust.yanit {
    margin-left: 32px;
  }
  textarea {
    width: 100%;
    min-height: 150px;
    box-sizing: border-box;
    resize: vertical;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: ${({ theme }) => theme.colors.neutral100};
    color: ${({ theme }) => theme.colors.neutral900};
    font: inherit;
    font-size: 15px;
    line-height: 1.6;
    outline: none;
  }
  textarea:focus {
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
  }
  .yanit-alt {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
`;

const Dugme = styled.button`
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid ${({ $ana }) => ($ana ? '#0d9488' : '#2e3b4b')};
  background: ${({ $ana }) => ($ana ? '#0d9488' : 'transparent')};
  color: ${({ $ana }) => ($ana ? '#fff' : '#c9d4e0')};
  transition: background 0.15s, border-color 0.15s;
  svg {
    width: 15px;
    height: 15px;
  }
  svg path {
    fill: currentColor;
  }
  &:hover:not(:disabled) {
    background: ${({ $ana }) => ($ana ? '#14b8a6' : '#1c2430')};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &.sag {
    margin-left: auto;
  }
`;

const Bilgi = ({ ikon: Ikon, etiket, children }) => (
  <div className="bilgi">
    <IkonKutu $boy={30}>
      <Ikon />
    </IkonKutu>
    <div style={{ minWidth: 0 }}>
      <small>{etiket}</small>
      {children}
    </div>
  </div>
);

export default function Mesajlar() {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [filtre, setFiltre] = React.useState('acik');
  const [liste, setListe] = React.useState(null);
  const [hata, setHata] = React.useState('');
  const [seciliId, setSeciliId] = React.useState(() => Number(new URLSearchParams(location.search).get('id')) || null);
  const [secili, setSecili] = React.useState(null);
  const [yanit, setYanit] = React.useState('');
  const [gonderiliyor, setGonderiliyor] = React.useState(false);

  const listeyiCek = React.useCallback(async () => {
    try {
      const { data } = await get(`/swb-panel/mesajlar?durum=${filtre}`);
      setListe(data.data);
      setHata('');
    } catch (e) {
      setHata(e?.response?.data?.error?.message || 'Mesajlar alınamadı.');
    }
  }, [filtre]);

  React.useEffect(() => {
    listeyiCek();
    const t = setInterval(listeyiCek, 30000);
    return () => clearInterval(t);
  }, [listeyiCek]);

  React.useEffect(() => {
    if (!seciliId) return setSecili(null);
    let iptal = false;
    setSecili(null);
    get(`/swb-panel/mesajlar/${seciliId}`)
      .then(({ data }) => {
        if (!iptal) {
          setSecili(data.data);
          listeyiCek();
        }
      })
      .catch(() => !iptal && setSecili({ yok: true }));
    const u = new URL(location.href);
    u.searchParams.set('id', seciliId);
    history.replaceState(history.state, '', u);
    return () => {
      iptal = true;
    };
  }, [seciliId]);

  const kapat = () => {
    setSeciliId(null);
    const u = new URL(location.href);
    u.searchParams.delete('id');
    history.replaceState(history.state, '', u);
  };

  const gonder = async () => {
    if (yanit.trim().length < 2) return;
    setGonderiliyor(true);
    try {
      const { data } = await post(`/swb-panel/mesajlar/${secili.id}/yanit`, { metin: yanit });
      setSecili(data.data);
      setYanit('');
      toggleNotification({ type: 'success', message: `Yanıt ${secili.eposta} adresine gönderildi.` });
      listeyiCek();
    } catch (e) {
      toggleNotification({ type: 'danger', message: e?.response?.data?.error?.message || 'Yanıt gönderilemedi.' });
    } finally {
      setGonderiliyor(false);
    }
  };

  const durumYap = async (durum) => {
    try {
      const { data } = await post(`/swb-panel/mesajlar/${secili.id}/durum`, { durum });
      setSecili(data.data);
      toggleNotification({ type: 'success', message: durum === 'arsiv' ? 'Mesaj arşive taşındı.' : 'Mesaj güncellendi.' });
      listeyiCek();
    } catch {
      toggleNotification({ type: 'danger', message: 'İşlem yapılamadı.' });
    }
  };

  const s = liste?.sayilar;
  const d = secili && !secili.yok ? secili : null;
  const yanitlar = Array.isArray(d?.yanitlar) ? d.yanitlar : [];

  return (
    <Layouts.Root>
      <Main>
        <Page.Title>Gelen Mesajlar</Page.Title>
        <Layouts.Header title="Gelen Mesajlar" subtitle="İletişim formundan gelen mesajlar. Buradan yazdığınız yanıt müşteriye e-postayla gider ve geçmişte saklanır." />
        <Sayfa>
          <Secici role="group" aria-label="Filtre">
            {FILTRELER.map(([k, ad, sayim]) => (
              <button
                key={k}
                type="button"
                aria-pressed={filtre === k}
                onClick={() => {
                  setFiltre(k);
                  kapat();
                }}
              >
                {ad}
                {s && sayim(s) > 0 && <span className="rozet">{sayim(s)}</span>}
              </button>
            ))}
          </Secici>
          {hata && (
            <div style={{ marginTop: 16 }}>
              <HataKutu>{hata}</HataKutu>
            </div>
          )}
          <Duzen $detay={!!seciliId}>
            <div className="liste-kutu">
              <Liste>
                {!liste && !hata && <Yukleniyor />}
                {liste && !liste.kayitlar.length && <BosDurum ikon={Message} metin={filtre === 'arsiv' ? 'Arşivde mesaj yok.' : 'Burada henüz mesaj yok. Yeni mesaj gelince hem burada görünür hem yöneticilere e-posta gider.'} />}
                {liste?.kayitlar.map((m) => (
                  <button key={m.id} type="button" className={`oge ${m.durum === 'yeni' ? 'yeni' : ''}`} aria-current={seciliId === m.id} onClick={() => setSeciliId(m.id)}>
                    <Avatar $renk={adRengi(m.ad)}>{basHarfler(m.ad)}</Avatar>
                    <span className="govde">
                      <span className="ust">
                        <span className="ad">{m.ad}</span>
                        <span className="zaman">{zamanOnce(m.createdAt)}</span>
                      </span>
                      <span className="konu" style={{ display: 'block' }}>
                        {m.konuAdi || m.konu || 'Konu yok'}
                        {m.durum === 'yanitlandi' && (
                          <Rozet $renk="#60a5fa" style={{ marginLeft: 8 }}>
                            Yanıtlandı
                          </Rozet>
                        )}
                      </span>
                      <span className="ozet" style={{ display: 'block' }}>
                        {m.mesaj}
                      </span>
                    </span>
                  </button>
                ))}
              </Liste>
            </div>
            <div className="detay-kutu">
              <Detay>
                {!seciliId && <BosDurum ikon={Mail} metin="Okumak ve yanıtlamak için soldan bir mesaj seçin." />}
                {seciliId && !secili && <Yukleniyor />}
                {secili?.yok && <BosDurum ikon={Mail} metin="Mesaj bulunamadı." />}
                {d && (
                  <>
                    <button type="button" className="geri" onClick={kapat}>
                      <ArrowLeft /> Tüm mesajlar
                    </button>
                    <div className="kisi">
                      <Avatar $boy={52} $renk={adRengi(d.ad)}>
                        {basHarfler(d.ad)}
                      </Avatar>
                      <div style={{ minWidth: 0 }}>
                        <h2>{d.ad}</h2>
                        <a href={`mailto:${d.eposta}`}>{d.eposta}</a>
                      </div>
                      <div className="eylemler">
                        <Rozet $renk={DURUM[d.durum]?.[1]}>{DURUM[d.durum]?.[0]}</Rozet>
                        {d.durum === 'arsiv' ? (
                          <Dugme type="button" onClick={() => durumYap('okundu')}>
                            <Mail /> Gelen kutusuna al
                          </Dugme>
                        ) : (
                          <Dugme type="button" onClick={() => durumYap('arsiv')}>
                            <Archive /> Arşivle
                          </Dugme>
                        )}
                      </div>
                    </div>
                    <div className="bilgiler">
                      <Bilgi ikon={Message} etiket="Konu">
                        <span>{d.konuAdi || d.konu || '-'}</span>
                      </Bilgi>
                      <Bilgi ikon={Phone} etiket="Telefon">
                        {d.telefon ? <a href={`tel:${d.telefon}`}>{d.telefon}</a> : <span>-</span>}
                      </Bilgi>
                      <Bilgi ikon={Clock} etiket="Gönderim">
                        <span>{tarihUzun(d.createdAt)}</span>
                      </Bilgi>
                      <Bilgi ikon={Earth} etiket="IP adresi">
                        <span>{d.ip || '-'}</span>
                      </Bilgi>
                    </div>
                    <div className="balon-ust">
                      <Mail width="14" height="14" /> {d.ad}, {zamanOnce(d.createdAt)}
                    </div>
                    <div className="balon">{d.mesaj}</div>
                    {yanitlar.map((y, i) => (
                      <React.Fragment key={i}>
                        <div className="balon-ust yanit">
                          <Check width="14" height="14" /> {y.gonderenAd} yanıtladı, {tarihUzun(y.tarih)}
                        </div>
                        <div className="balon yanit">{y.metin}</div>
                      </React.Fragment>
                    ))}
                    <div style={{ marginTop: 26 }}>
                      <label htmlFor="swb-yanit" style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                        Yanıt yaz
                      </label>
                      <textarea id="swb-yanit" value={yanit} onChange={(e) => setYanit(e.target.value)} placeholder={`Merhaba ${d.ad.split(' ')[0]},`} maxLength={8000} />
                      <div className="yanit-alt">
                        <span>
                          Yanıt <b>{d.eposta}</b> adresine SunucumWEB adıyla gider, altında müşterinin mesajı da yer alır.
                        </span>
                        <Dugme type="button" $ana className="sag" disabled={gonderiliyor || yanit.trim().length < 2} onClick={gonder}>
                          <PaperPlane /> {gonderiliyor ? 'Gönderiliyor…' : 'Yanıtı gönder'}
                        </Dugme>
                      </div>
                    </div>
                  </>
                )}
              </Detay>
            </div>
          </Duzen>
        </Sayfa>
      </Main>
    </Layouts.Root>
  );
}
