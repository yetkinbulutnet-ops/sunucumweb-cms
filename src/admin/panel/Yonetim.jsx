import * as React from 'react';
import { styled } from 'styled-components';
import { Link, useParams } from 'react-router-dom';
import { Layouts, Page } from '@strapi/strapi/admin';
import { Main } from '@strapi/design-system';
import { Search } from '@strapi/icons';
import { Sayfa, Kart, IkonKutu, useVeri, sayi } from './ui';
import { BOLUMLER } from './bolumler';
import YonetimMenusu from './YonetimMenusu';

const YapayZeka = React.lazy(() => import('./YapayZeka'));
const OtomatikBlog = React.lazy(() => import('./OtomatikBlog'));

const Ara = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 0 14px;
  margin-bottom: 26px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: ${({ theme }) => theme.colors.neutral0};
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  svg path {
    fill: ${({ theme }) => theme.colors.neutral500};
  }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral900};
    font: inherit;
    font-size: 14px;
    padding: 12px 0;
  }
  &:focus-within {
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
  }
`;

const BolumBaslik = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 16px;
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.neutral900};
  }
  p {
    margin: 2px 0 0;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
`;

const Kutular = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  margin-bottom: 36px;
`;

const Oge = styled(Link)`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 14px;
  text-decoration: none;
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  min-width: 0;
  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    border-color: ${({ $renk }) => $renk};
    box-shadow: 0 12px 28px -14px ${({ $renk }) => $renk};
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
  strong {
    display: block;
    font-size: 14.5px;
    color: ${({ theme }) => theme.colors.neutral800};
  }
  span.acik {
    display: block;
    margin-top: 3px;
    font-size: 12.5px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  span.sayi {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.neutral600};
    background: ${({ theme }) => theme.colors.neutral100};
    padding: 2px 9px;
    border-radius: 999px;
    white-space: nowrap;
  }
`;

const kucuk = (s) => s.toLocaleLowerCase('tr');

export default function Yonetim() {
  const alt = useParams()['*'];
  if (alt === 'yapay-zeka')
    return (
      <React.Suspense fallback={null}>
        <YapayZeka />
      </React.Suspense>
    );
  if (alt === 'otomatik-blog')
    return (
      <React.Suspense fallback={null}>
        <OtomatikBlog />
      </React.Suspense>
    );
  return <Merkez />;
}

function Merkez() {
  const [ara, setAra] = React.useState('');
  const { veri } = useVeri('/swb-panel/ozet');
  const sayilar = veri?.sayilar || {};
  const q = kucuk(ara.trim());
  const bolumler = BOLUMLER.map((b) => ({ ...b, ogeler: q ? b.ogeler.filter((o) => kucuk(`${o.ad} ${o.aciklama} ${b.ad}`).includes(q)) : b.ogeler })).filter((b) => b.ogeler.length);
  return (
    <Layouts.Root sideNav={<YonetimMenusu />}>
      <Main>
        <Page.Title>Site Yönetimi</Page.Title>
        <Layouts.Header title="Site Yönetimi" subtitle="Soldaki menüden ya da aşağıdan bir bölüm seçin. Kaydettiğiniz değişiklikler birkaç saniye içinde sitede görünür." />
        <Sayfa>
          <Ara>
            <Search />
            <input type="search" value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ne düzenlemek istiyorsunuz? (ör. kampanya, slayt, menü)" aria-label="Bölüm ara" />
          </Ara>
          {!bolumler.length && <Kart>Aramanızla eşleşen bölüm yok.</Kart>}
          {bolumler.map((b) => (
            <section key={b.ad}>
              <BolumBaslik>
                <IkonKutu $boy={42}>
                  <b.ikon />
                </IkonKutu>
                <div>
                  <h2>{b.ad}</h2>
                  <p>{b.aciklama}</p>
                </div>
              </BolumBaslik>
              <Kutular>
                {b.ogeler.map((o) => (
                  <Oge key={o.yol} to={o.yol} $renk="#2dd4bf">
                    <IkonKutu $boy={38}>
                      <o.ikon />
                    </IkonKutu>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong>{o.ad}</strong>
                      <span className="acik">{o.aciklama}</span>
                    </span>
                    {o.uid && sayilar[o.uid] != null && <span className="sayi">{sayi(sayilar[o.uid])}</span>}
                  </Oge>
                ))}
              </Kutular>
            </section>
          ))}
        </Sayfa>
      </Main>
    </Layouts.Root>
  );
}
