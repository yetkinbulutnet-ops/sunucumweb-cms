import * as React from 'react';
import { styled } from 'styled-components';
import { Link } from 'react-router-dom';
import { Layouts, Page, useFetchClient, useNotification } from '@strapi/strapi/admin';
import { Main } from '@strapi/design-system';
import { ArrowLeft, Feather, Clock, Folder, PriceTag, Check, Cross, Cog, Plus, Sparkle } from '@strapi/icons';
import { Sayfa, Kart, KartBaslik, IkonKutu, Rozet, Yukleniyor, HataKutu, BosDurum, tarihUzun, zamanOnce, sayi } from './ui';
import YonetimMenusu from './YonetimMenusu';

const CM = '/content-manager';
const AYAR_YOLU = `${CM}/single-types/api::otomatik-blog.otomatik-blog`;
const HAVUZ_YOLU = `${CM}/collection-types/api::blog-konu.blog-konu`;
const YAZI_YOLU = `${CM}/collection-types/api::blog-yazisi.blog-yazisi`;

const SONUC = {
  taslak: ['Taslak hazır', '#60a5fa'],
  yayinlandi: ['Yayınlandı', '#2dd4bf'],
  oneri: ['Konu önerisi', '#a78bfa'],
  reddedildi: ['Reddedildi', '#f59e0b'],
  atlandi: ['Atlandı', '#9fb0c2'],
  hata: ['Hata', '#f87171'],
};
const TUR = { zamanli: 'Zamanlanmış', elle: 'Elle', 'konu-onerisi': 'Konu önerisi' };

const GeriLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral600};
  text-decoration: none;
  &:hover {
    color: #2dd4bf;
  }
`;

const Ozetler = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 14px;
  .ic {
    display: flex;
    gap: 14px;
    align-items: center;
    min-width: 0;
  }
  small {
    display: block;
    font-size: 12.5px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  strong {
    display: block;
    margin-top: 2px;
    font-size: 17px;
    color: ${({ theme }) => theme.colors.neutral900};
    overflow-wrap: anywhere;
  }
  em {
    display: block;
    font-style: normal;
    font-size: 12px;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
`;

const Eylemler = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0;
`;

const Dugme = styled.button`
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid ${({ $ana, theme }) => ($ana ? '#0f766e' : theme.colors.neutral200)};
  background: ${({ $ana, theme }) => ($ana ? '#0f766e' : theme.colors.neutral0)};
  color: ${({ $ana, theme }) => ($ana ? '#ffffff' : theme.colors.neutral800)};
  &:hover:not(:disabled) {
    border-color: #14b8a6;
    background: ${({ $ana, theme }) => ($ana ? '#115e59' : theme.colors.neutral100)};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  svg {
    width: 14px;
    height: 14px;
  }
`;

const Izgara = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const KonuListe = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
  li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.neutral100};
    border: 1px solid ${({ theme }) => theme.colors.neutral150};
    min-width: 0;
  }
  .metin {
    flex: 1;
    min-width: 0;
  }
  b {
    display: block;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.neutral900};
    overflow-wrap: anywhere;
  }
  span {
    display: block;
    margin-top: 3px;
    font-size: 12.5px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.neutral500};
    overflow-wrap: anywhere;
  }
  .islem {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .islem button {
    appearance: none;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: ${({ theme }) => theme.colors.neutral0};
    color: ${({ theme }) => theme.colors.neutral700};
    cursor: pointer;
  }
  .islem button.onay:hover {
    border-color: #14b8a6;
    color: #2dd4bf;
  }
  .islem button.ret:hover {
    border-color: #f87171;
    color: #f87171;
  }
  .islem svg {
    width: 13px;
    height: 13px;
  }
`;

const Tablo = styled.div`
  overflow-x: auto;
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
    min-width: 640px;
  }
  th {
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.neutral500};
    padding: 0 10px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  }
  td {
    padding: 12px 10px;
    vertical-align: top;
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
    color: ${({ theme }) => theme.colors.neutral800};
  }
  td.kucuk {
    font-size: 12.5px;
    color: ${({ theme }) => theme.colors.neutral500};
    white-space: nowrap;
  }
  pre {
    margin: 6px 0 0;
    white-space: pre-wrap;
    font: inherit;
    font-size: 12.5px;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.neutral500};
    overflow-wrap: anywhere;
  }
  a {
    color: #2dd4bf;
    text-decoration: none;
  }
`;

const Bilgi = styled.p`
  margin: 0 0 4px;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral600};
  max-width: 900px;
`;

const sonrakiYaz = (d) => {
  if (!d.ayar.aktif) return ['Kapalı', 'Ayarlardan açabilirsiniz'];
  if (!d.sonraki) return ['-', ''];
  const t = new Date(d.sonraki);
  if (t.getTime() <= Date.now() + 60000) return ['Bir sonraki saat başı', 'Sırada konu varsa yazılır'];
  return [t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }), `Saat ${String(d.ayar.saat).padStart(2, '0')}:00 sonrası`];
};

export default function OtomatikBlog() {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [d, setD] = React.useState(null);
  const [hata, setHata] = React.useState(null);
  const [mesgul, setMesgul] = React.useState(false);

  const cek = React.useCallback(async () => {
    try {
      const { data } = await get('/swb-panel/otomatik-blog');
      setD(data.data);
      setHata(null);
    } catch (e) {
      setHata(e?.response?.data?.error?.message || 'Veri alınamadı.');
    }
  }, [get]);

  React.useEffect(() => {
    cek();
  }, [cek]);

  const calisiyor = !!d?.calisiyor;
  React.useEffect(() => {
    const t = setInterval(cek, calisiyor ? 8000 : 60000);
    return () => clearInterval(t);
  }, [cek, calisiyor]);

  const istek = async (yol, govde, basari) => {
    setMesgul(true);
    try {
      const { data } = await post(`/swb-panel/otomatik-blog${yol}`, govde || {});
      if (basari) toggleNotification({ type: 'success', message: typeof basari === 'function' ? basari(data.data) : basari });
      await cek();
    } catch (e) {
      toggleNotification({ type: 'danger', message: e?.response?.data?.error?.message || 'İşlem yapılamadı.' });
    } finally {
      setMesgul(false);
    }
  };

  if (hata && !d)
    return (
      <Kabuk>
        <HataKutu>{hata}</HataKutu>
      </Kabuk>
    );
  if (!d)
    return (
      <Kabuk>
        <Yukleniyor />
      </Kabuk>
    );

  const [sonraki, sonrakiAlt] = sonrakiYaz(d);
  const bakiye = d.bakiye?.hata ? ['Okunamadı', d.bakiye.hata] : [`${Number(d.bakiye.toplam).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${d.bakiye.paraBirimi === 'USD' ? '$' : d.bakiye.paraBirimi}`, d.bakiye.kullanilabilir ? 'Kullanılabilir' : 'Bakiye yüklemeniz gerekiyor'];
  const kilit = mesgul || calisiyor;

  return (
    <Kabuk>
      <Bilgi>
        Sistem her saat başı kontrol eder; ayarladığınız gün aralığı dolduğunda ve saat geldiğinde konu havuzunda sıradaki konuyu yazar, kapak görselini hazırlar ve tüm yöneticilere e-posta gönderir. Otomatik yayın kapalıysa yazı taslak olarak bekler.
      </Bilgi>
      <Eylemler>
        <Dugme type="button" $ana disabled={kilit || !d.anahtar} onClick={() => istek('/uret', null, 'Yazı üretimi başladı. Birkaç dakika sürebilir, bitince bu sayfada görünecek.')}>
          <Feather /> {calisiyor ? 'Yazı hazırlanıyor...' : 'Şimdi bir yazı üret'}
        </Dugme>
        <Dugme type="button" disabled={kilit || !d.anahtar} onClick={() => istek('/oner', null, 'Konu önerileri hazırlanıyor, bir dakika içinde aşağıda görünecek.')}>
          <Sparkle /> Konu öner
        </Dugme>
        <Dugme as={Link} to={AYAR_YOLU}>
          <Cog /> Ayarlar
        </Dugme>
        <Dugme as={Link} to={`${HAVUZ_YOLU}/create`}>
          <Plus /> Konu ekle
        </Dugme>
        <Dugme as={Link} to={HAVUZ_YOLU}>
          <Folder /> Konu havuzu
        </Dugme>
      </Eylemler>

      <Ozetler style={{ marginBottom: 16 }}>
        <Kart>
          <div className="ic">
            <IkonKutu $boy={40}>
              <Feather />
            </IkonKutu>
            <div>
              <small>Durum</small>
              <strong>{d.ayar.aktif ? 'Açık' : 'Kapalı'}</strong>
              <em>{d.ayar.aktif ? `${d.ayar.periyotGun} günde bir, ${d.ayar.otoYayin ? 'otomatik yayın açık' : 'taslak olarak'}` : 'Zamanlanmış üretim yapılmıyor'}</em>
            </div>
          </div>
        </Kart>
        <Kart>
          <div className="ic">
            <IkonKutu $boy={40}>
              <Clock />
            </IkonKutu>
            <div>
              <small>Sıradaki yazı</small>
              <strong>{sonraki}</strong>
              <em>{sonrakiAlt}</em>
            </div>
          </div>
        </Kart>
        <Kart>
          <div className="ic">
            <IkonKutu $boy={40}>
              <Folder />
            </IkonKutu>
            <div>
              <small>Konu havuzu</small>
              <strong>{sayi(d.havuz.sirada)} konu sırada</strong>
              <em>
                {sayi(d.havuz.onayBekliyor)} onay bekliyor, {sayi(d.havuz.yazildi)} yazıldı
              </em>
            </div>
          </div>
        </Kart>
        <Kart>
          <div className="ic">
            <IkonKutu $boy={40}>
              <PriceTag />
            </IkonKutu>
            <div>
              <small>DeepSeek bakiyesi</small>
              <strong>{bakiye[0]}</strong>
              <em>{bakiye[1]}</em>
            </div>
          </div>
        </Kart>
      </Ozetler>

      <Izgara>
        <Kart>
          <KartBaslik>
            <h2>Onay bekleyen konu önerileri</h2>
            {!!d.oneriler.length && (
              <Dugme type="button" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 13 }} disabled={mesgul} onClick={() => istek('/onayla', null, (r) => `${r.onaylanan} konu sıraya alındı.`)}>
                <Check /> Tümünü onayla
              </Dugme>
            )}
          </KartBaslik>
          {d.oneriler.length ? (
            <KonuListe>
              {d.oneriler.map((k) => (
                <li key={k.id}>
                  <div className="metin">
                    <b>{k.konu}</b>
                    <span>{[k.kategori?.ad, k.anahtarKelime && `Anahtar kelime: ${k.anahtarKelime}`].filter(Boolean).join(' | ')}</span>
                    {k.notlar && <span>{k.notlar}</span>}
                  </div>
                  <div className="islem">
                    <button type="button" className="onay" title="Onayla, sıraya al" aria-label="Onayla" disabled={mesgul} onClick={() => istek(`/konu/${k.id}`, { durum: 'sirada' }, 'Konu sıraya alındı.')}>
                      <Check />
                    </button>
                    <button type="button" className="ret" title="Bu konuyu yazma" aria-label="Reddet" disabled={mesgul} onClick={() => istek(`/konu/${k.id}`, { durum: 'atlandi' }, 'Konu atlandı.')}>
                      <Cross />
                    </button>
                  </div>
                </li>
              ))}
            </KonuListe>
          ) : (
            <BosDurum kucuk metin="Onay bekleyen öneri yok. Havuz azalınca sistem kendisi önerir, isterseniz yukarıdan da isteyebilirsiniz." />
          )}
        </Kart>
        <Kart>
          <KartBaslik>
            <h2>Sıradaki konular</h2>
            <span className="ek">İlk sıradaki önce yazılır</span>
          </KartBaslik>
          {d.siradakiler.length ? (
            <KonuListe>
              {d.siradakiler.map((k, i) => (
                <li key={k.id}>
                  <IkonKutu $boy={30}>{i + 1}</IkonKutu>
                  <div className="metin">
                    <b>{k.konu}</b>
                    <span>{[k.kategori?.ad, k.anahtarKelime && `Anahtar kelime: ${k.anahtarKelime}`, k.oncelik ? `Öncelik ${k.oncelik}` : ''].filter(Boolean).join(' | ')}</span>
                  </div>
                </li>
              ))}
            </KonuListe>
          ) : (
            <BosDurum kucuk metin="Sırada konu yok. Konu ekleyin ya da önerileri onaylayın." />
          )}
        </Kart>
      </Izgara>

      <Kart>
        <KartBaslik>
          <h2>Son çalışmalar</h2>
          <span className="ek">Son 15 kayıt</span>
        </KartBaslik>
        {d.kayitlar.length ? (
          <Tablo>
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Sonuç</th>
                  <th>Ayrıntı</th>
                  <th>Token</th>
                </tr>
              </thead>
              <tbody>
                {d.kayitlar.map((r) => {
                  const [ad, renk] = SONUC[r.sonuc] || [r.sonuc, '#9fb0c2'];
                  return (
                    <tr key={r.id}>
                      <td className="kucuk" title={tarihUzun(r.createdAt)}>
                        {zamanOnce(r.createdAt)}
                        <br />
                        {TUR[r.tur] || r.tur}
                      </td>
                      <td>
                        <Rozet $renk={renk}>{ad}</Rozet>
                      </td>
                      <td>
                        {r.yazi?.documentId ? <Link to={`${YAZI_YOLU}/${r.yazi.documentId}`}>{r.baslik}</Link> : r.baslik}
                        {r.ayrinti && <pre>{r.ayrinti}</pre>}
                      </td>
                      <td className="kucuk">{r.girdiToken || r.ciktiToken ? `${sayi(r.girdiToken)} / ${sayi(r.ciktiToken)}` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tablo>
        ) : (
          <BosDurum kucuk metin="Henüz çalışma kaydı yok." />
        )}
      </Kart>
    </Kabuk>
  );
}

function Kabuk({ children }) {
  return (
    <Layouts.Root sideNav={<YonetimMenusu />}>
      <Main>
        <Page.Title>Otomatik blog</Page.Title>
        <Layouts.Header title="Otomatik blog" subtitle="Yapay zekâ ile düzenli blog yazısı üretimi, konu havuzu ve çalışma geçmişi." />
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
