import * as React from 'react';
import { styled } from 'styled-components';
import { Link } from 'react-router-dom';
import { Layouts, Page, useFetchClient, useNotification } from '@strapi/strapi/admin';
import { Main } from '@strapi/design-system';
import { ArrowLeft, Information, WarningCircle, CheckCircle } from '@strapi/icons';
import { Sayfa, Kart, Yukleniyor, HataKutu, useVeri } from './ui';
import YonetimMenusu from './YonetimMenusu';

const UC = '/content-manager/single-types/api::ai-ayari.ai-ayari';

const BOLUMLER = [
  {
    alan: 'sistemTalimati',
    ad: 'Rol ve kurallar',
    ozet: 'Yapay zekânın kim gibi davranacağı ve uyacağı kurallar',
    aciklama:
      'Her istekte en başta gönderilen ana metin. Yapay zekâya hangi rolde olduğunu (ör. alan adı danışmanı), önerilerde nelere dikkat edeceğini ve nelerden kaçınacağını anlatır. Kuralları madde madde yazmak en iyi sonucu verir.',
    sinir: 10000,
    satir: 18,
    zorunlu: [],
    degiskenler: [],
  },
  {
    alan: 'kullaniciSablonu',
    ad: 'Ziyaretçi isteği',
    ozet: 'Ziyaretçinin yazdığı açıklamanın nasıl iletileceği',
    aciklama:
      'Ziyaretçi sitedeki kutuya işini anlattığında bu şablon doldurulup yapay zekâya gönderilir. Süslü parantezli kelimeler otomatik doldurulur; aşağıdaki kutucuklara tıklayarak imlecin olduğu yere ekleyebilirsiniz.',
    sinir: 3000,
    satir: 10,
    zorunlu: ['tanim', 'adet'],
    degiskenler: [
      ['tanim', 'Ziyaretçinin yazdığı açıklama'],
      ['adet', 'İstenen öneri sayısı'],
      ['uzanti_satiri', 'Uzantı kısıtı satırı (seçtiyse)'],
    ],
  },
  {
    alan: 'uzantiSatiri',
    ad: 'Uzantı kısıtı',
    ozet: 'Ziyaretçi uzantı seçtiğinde eklenen tek satır',
    aciklama: 'Ziyaretçi belirli uzantıları (ör. .com, .com.tr) seçerse bu satır ziyaretçi isteğine eklenir. Uzantı seçmezse hiç kullanılmaz.',
    sinir: 300,
    satir: 3,
    zorunlu: ['uzantilar'],
    degiskenler: [['uzantilar', 'Seçilen uzantılar']],
  },
  {
    alan: 'jsonTalimati',
    ad: 'Yedek model notu',
    ozet: 'Ana servis yanıt vermezse kullanılan teknik not',
    aciklama:
      'Ana servis yanıt veremediğinde devreye giren yedek model, cevabı hangi biçimde vereceğini bu notla öğrenir. Teknik bir metindir; {sema} kısmı sistem tarafından doldurulur ve silinmemelidir. Genellikle değiştirmeniz gerekmez.',
    sinir: 1000,
    satir: 5,
    zorunlu: ['sema'],
    degiskenler: [['sema', 'Cevap biçimi (otomatik)']],
  },
];

const doldur = (sablon, degerler) => String(sablon || '').replace(/\{(\w+)\}/g, (t, a) => (a in degerler ? degerler[a] : t));

const Duzen = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Menu = styled.nav`
  display: grid;
  gap: 6px;
  position: sticky;
  top: 16px;
  @media (max-width: 960px) {
    position: static;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  }
  button {
    appearance: none;
    text-align: left;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral700};
    font: inherit;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  button:hover {
    background: ${({ theme }) => theme.colors.neutral0};
  }
  button[aria-current='true'] {
    background: ${({ theme }) => theme.colors.neutral0};
    border-color: ${({ theme }) => theme.colors.neutral200};
    box-shadow: inset 3px 0 0 #2dd4bf;
  }
  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14.5px;
    color: ${({ theme }) => theme.colors.neutral900};
  }
  strong i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f59e0b;
  }
  span {
    display: block;
    margin-top: 3px;
    font-size: 12.5px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.neutral500};
  }
`;

const Editor = styled.div`
  h2 {
    margin: 0 0 6px;
    font-size: 19px;
    color: ${({ theme }) => theme.colors.neutral900};
  }
  p.aciklama {
    margin: 0 0 18px;
    font-size: 14px;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.neutral600};
    max-width: 760px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    padding: 16px 18px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: ${({ theme }) => theme.colors.neutral100};
    color: ${({ theme }) => theme.colors.neutral900};
    font-family: 'JetBrains Mono', Consolas, Menlo, monospace;
    font-size: 13.5px;
    line-height: 1.7;
    outline: none;
    tab-size: 2;
  }
  textarea:focus {
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
  }
  .alt {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    margin-top: 10px;
    font-size: 12.5px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  .sayac {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }
  .sayac.dolu {
    color: #f87171;
  }
  .cipler {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .cipler button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: ${({ theme }) => theme.colors.neutral0};
    color: ${({ theme }) => theme.colors.neutral700};
    font: inherit;
    font-size: 12.5px;
    cursor: pointer;
  }
  .cipler button:hover {
    border-color: #14b8a6;
  }
  .cipler code {
    color: #5eead4;
    font-size: 12.5px;
  }
  .uyari {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 13.5px;
    line-height: 1.5;
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fcd34d;
  }
  .uyari svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 1px;
  }
  .uyari svg path {
    fill: currentColor;
  }
`;

const Onizleme = styled.div`
  margin-top: 24px;
  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    color: ${({ theme }) => theme.colors.neutral800};
  }
  .ornek {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 90px minmax(0, 180px);
    gap: 10px;
    margin: 12px 0;
    @media (max-width: 640px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  label {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
    margin-bottom: 4px;
  }
  input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: ${({ theme }) => theme.colors.neutral100};
    color: ${({ theme }) => theme.colors.neutral900};
    font: inherit;
    font-size: 13.5px;
    outline: none;
  }
  input:focus {
    border-color: #14b8a6;
  }
  pre {
    margin: 0;
    padding: 16px 18px;
    border-radius: 12px;
    background: #0b1017;
    border: 1px solid ${({ theme }) => theme.colors.neutral150};
    color: #c9d4e0;
    font-family: 'JetBrains Mono', Consolas, Menlo, monospace;
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    max-height: 320px;
    overflow: auto;
  }
  pre mark {
    background: rgba(45, 212, 191, 0.16);
    color: #5eead4;
    border-radius: 3px;
    padding: 0 2px;
  }
`;

const Durum = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  margin-bottom: 22px;
  font-size: 14px;
  line-height: 1.55;
  border: 1px solid ${({ $acik }) => ($acik ? 'rgba(52,211,153,.3)' : 'rgba(159,176,194,.25)')};
  background: ${({ $acik }) => ($acik ? 'rgba(52,211,153,.07)' : 'rgba(159,176,194,.06)')};
  color: ${({ theme }) => theme.colors.neutral700};
  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 2px;
  }
  svg path {
    fill: ${({ $acik }) => ($acik ? '#34d399' : '#9fb0c2')};
  }
  b {
    color: ${({ theme }) => theme.colors.neutral900};
  }
`;

const KayitCubugu = styled.div`
  position: sticky;
  bottom: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #1c2430;
  border: 1px solid #2e3b4b;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  font-size: 14px;
  color: #e8eef5;
  span {
    flex: 1;
    min-width: 180px;
  }
  button {
    appearance: none;
    border-radius: 10px;
    padding: 10px 18px;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid #3d4d60;
    background: transparent;
    color: #e8eef5;
  }
  button.ana {
    background: #0d9488;
    border-color: #0d9488;
    color: #fff;
  }
  button.ana:hover:not(:disabled) {
    background: #14b8a6;
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const GeriLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
  color: #2dd4bf;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  svg path {
    fill: currentColor;
  }
`;

export default function YapayZeka() {
  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [kayitli, setKayitli] = React.useState(null);
  const [form, setForm] = React.useState(null);
  const [hata, setHata] = React.useState('');
  const [aktif, setAktif] = React.useState(BOLUMLER[0].alan);
  const [kaydediliyor, setKaydediliyor] = React.useState(false);
  const [ornek, setOrnek] = React.useState({ tanim: "İstanbul'da küçük bir kahve dükkanı açıyorum, samimi ve kısa bir isim arıyorum.", adet: 6, uzantilar: '.com .com.tr' });
  const alanRef = React.useRef(null);
  const site = useVeri('/swb-panel/site-durumu');
  const motor = site.veri?.engines?.find((e) => e.id === 'domain-ai');

  React.useEffect(() => {
    get(UC)
      .then(({ data }) => {
        const d = data.data || {};
        const v = Object.fromEntries(['ad', ...BOLUMLER.map((b) => b.alan)].map((k) => [k, d[k] ?? '']));
        setKayitli(v);
        setForm(v);
      })
      .catch(() => setHata('Ayarlar yüklenemedi.'));
  }, []);

  React.useEffect(() => {
    const uyar = (e) => {
      if (form && kayitli && BOLUMLER.some((b) => form[b.alan] !== kayitli[b.alan])) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', uyar);
    return () => window.removeEventListener('beforeunload', uyar);
  }, [form, kayitli]);

  if (hata) return <Kabuk><HataKutu>{hata}</HataKutu></Kabuk>;
  if (!form) return <Kabuk><Yukleniyor /></Kabuk>;

  const b = BOLUMLER.find((x) => x.alan === aktif);
  const deger = form[b.alan] || '';
  const degisenler = BOLUMLER.filter((x) => form[x.alan] !== kayitli[x.alan]);
  const eksik = b.zorunlu.filter((z) => !deger.includes(`{${z}}`));
  const guncelle = (v) => setForm((f) => ({ ...f, [b.alan]: v.slice(0, b.sinir) }));

  const ekle = (ad) => {
    const el = alanRef.current;
    const parca = `{${ad}}`;
    if (!el) return guncelle(deger + parca);
    const bas = el.selectionStart ?? deger.length;
    const son = el.selectionEnd ?? deger.length;
    guncelle(deger.slice(0, bas) + parca + deger.slice(son));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(bas + parca.length, bas + parca.length);
    });
  };

  const kaydet = async () => {
    const sorunlu = BOLUMLER.find((x) => x.zorunlu.some((z) => !String(form[x.alan] || '').includes(`{${z}}`)));
    if (sorunlu) {
      setAktif(sorunlu.alan);
      toggleNotification({ type: 'warning', message: `${sorunlu.ad} bölümünde zorunlu bir alan eksik.` });
      return;
    }
    setKaydediliyor(true);
    try {
      const { data } = await put(UC, form);
      const d = data.data || form;
      const v = Object.fromEntries(Object.keys(form).map((k) => [k, d[k] ?? form[k]]));
      setKayitli(v);
      setForm(v);
      toggleNotification({ type: 'success', message: 'Kaydedildi. Değişiklik bir sonraki istekten itibaren geçerli.' });
    } catch (e) {
      toggleNotification({ type: 'danger', message: e?.response?.data?.error?.message || 'Kaydedilemedi.' });
    } finally {
      setKaydediliyor(false);
    }
  };

  const uzantiSatiri = ornek.uzantilar.trim() ? `\n${doldur(form.uzantiSatiri, { uzantilar: ornek.uzantilar.trim() })}` : '';
  const ziyaretciMesaji = doldur(form.kullaniciSablonu, { tanim: ornek.tanim, uzanti_satiri: uzantiSatiri, adet: ornek.adet });

  return (
    <Kabuk>
      <Durum $acik={motor?.ready}>
        {motor?.ready ? <CheckCircle /> : <Information />}
        <div>
          {motor?.ready ? (
            <>
              <b>Sitede açık.</b> Ziyaretçiler alan adı sayfasındaki yapay zekâ bulucuyu kullanabiliyor.
            </>
          ) : (
            <>
              <b>Sitede şu an kapalı.</b> Yapay zekâ servisinin anahtarı sunucuya henüz eklenmedi. Buradaki metinleri yine de hazırlayabilirsiniz; anahtar eklendiğinde bu ayarlarla çalışır.
            </>
          )}
        </div>
      </Durum>

      <Duzen>
        <Menu aria-label="Bölümler">
          {BOLUMLER.map((x) => (
            <button key={x.alan} type="button" aria-current={aktif === x.alan} onClick={() => setAktif(x.alan)}>
              <strong>
                {x.ad}
                {form[x.alan] !== kayitli[x.alan] && <i title="Kaydedilmedi" />}
              </strong>
              <span>{x.ozet}</span>
            </button>
          ))}
        </Menu>

        <div style={{ minWidth: 0 }}>
          <Kart $dolgu="24px 26px">
            <Editor>
              <h2>{b.ad}</h2>
              <p className="aciklama">{b.aciklama}</p>
              {!!b.degiskenler.length && (
                <div className="cipler">
                  {b.degiskenler.map(([ad, acik]) => (
                    <button key={ad} type="button" onClick={() => ekle(ad)} title="İmlecin olduğu yere ekle">
                      <code>{`{${ad}}`}</code> {acik}
                    </button>
                  ))}
                </div>
              )}
              <textarea ref={alanRef} rows={b.satir} value={deger} onChange={(e) => guncelle(e.target.value)} spellCheck={false} aria-label={b.ad} />
              <div className="alt">
                {deger !== kayitli[b.alan] && (
                  <button type="button" onClick={() => guncelle(kayitli[b.alan])} style={{ appearance: 'none', border: 0, background: 'none', color: '#2dd4bf', font: 'inherit', cursor: 'pointer', padding: 0 }}>
                    Bu bölümü kayıtlı haline döndür
                  </button>
                )}
                <span className={`sayac${deger.length >= b.sinir ? ' dolu' : ''}`}>
                  {deger.length.toLocaleString('tr-TR')} / {b.sinir.toLocaleString('tr-TR')} karakter
                </span>
              </div>
              {!!eksik.length && (
                <div className="uyari">
                  <WarningCircle />
                  <span>
                    {eksik.map((z) => `{${z}}`).join(', ')} metinde yok. Bu kısım silinirse ilgili bilgi yapay zekâya iletilmez; yukarıdaki kutucuktan tekrar ekleyin.
                  </span>
                </div>
              )}
            </Editor>

            {(b.alan === 'kullaniciSablonu' || b.alan === 'uzantiSatiri') && (
              <Onizleme>
                <h3>Önizleme</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8a9bb0' }}>Örnek bir ziyaretçi isteği için yapay zekâya gidecek metin:</p>
                <div className="ornek">
                  <div>
                    <label htmlFor="swb-ornek-tanim">Ziyaretçinin açıklaması</label>
                    <input id="swb-ornek-tanim" value={ornek.tanim} onChange={(e) => setOrnek((o) => ({ ...o, tanim: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="swb-ornek-adet">Öneri sayısı</label>
                    <input id="swb-ornek-adet" type="number" min="1" max="12" value={ornek.adet} onChange={(e) => setOrnek((o) => ({ ...o, adet: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="swb-ornek-uzanti">Seçilen uzantılar</label>
                    <input id="swb-ornek-uzanti" value={ornek.uzantilar} onChange={(e) => setOrnek((o) => ({ ...o, uzantilar: e.target.value }))} placeholder="boş = uzantı seçilmedi" />
                  </div>
                </div>
                <pre>{ziyaretciMesaji}</pre>
              </Onizleme>
            )}
          </Kart>

          {!!degisenler.length && (
            <KayitCubugu role="region" aria-label="Kaydedilmemiş değişiklikler">
              <span>
                Kaydedilmemiş değişiklik: <b>{degisenler.map((x) => x.ad).join(', ')}</b>
              </span>
              <button type="button" onClick={() => setForm(kayitli)} disabled={kaydediliyor}>
                Vazgeç
              </button>
              <button type="button" className="ana" onClick={kaydet} disabled={kaydediliyor}>
                {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </KayitCubugu>
          )}
        </div>
      </Duzen>
    </Kabuk>
  );
}

function Kabuk({ children }) {
  return (
    <Layouts.Root sideNav={<YonetimMenusu />}>
      <Main>
        <Page.Title>Yapay zekâ ayarları</Page.Title>
        <Layouts.Header title="Yapay zekâ ayarları" subtitle="Alan adı sayfasındaki yapay zekâ bulucunun ziyaretçilere nasıl öneri üreteceğini buradan yönetirsiniz." />
        <Sayfa>
          <GeriLink to="/yonetim">
            <ArrowLeft width="14" height="14" /> Site Yönetimi
          </GeriLink>
          {children}
        </Sayfa>
      </Main>
    </Layouts.Root>
  );
}
