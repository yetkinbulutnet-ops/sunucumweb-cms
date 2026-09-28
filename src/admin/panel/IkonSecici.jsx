import * as React from 'react';
import { createPortal } from 'react-dom';
import { styled, keyframes } from 'styled-components';
import { Field } from '@strapi/design-system';
import IKONLAR from './ikonlar.json';

const HARITA = Object.fromEntries(IKONLAR.map((i) => [i.ad, i]));

const Svg = ({ d, boy = 24 }) => (
  <svg viewBox="0 0 24 24" width={boy} height={boy} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const Tetik = styled.button`
  appearance: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 8px 14px 8px 8px;
  border-radius: 10px;
  border: 1px solid ${({ theme, $hata }) => ($hata ? theme.colors.danger600 : theme.colors.neutral200)};
  background: ${({ theme }) => theme.colors.neutral0};
  color: ${({ theme }) => theme.colors.neutral800};
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover:not(:disabled) {
    border-color: #14b8a6;
  }
  &:focus-visible {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .kutu {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(45, 212, 191, 0.12);
    color: #2dd4bf;
  }
  .ad {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ad small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral500};
  }
  .degistir {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 700;
    color: #2dd4bf;
  }
`;

const belir = keyframes`from{opacity:0}to{opacity:1}`;
const yuksel = keyframes`from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}`;

const Kaplama = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2147482000;
  background: rgba(3, 7, 12, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${belir} 0.15s ease;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Pencere = styled.div`
  width: 100%;
  max-width: 760px;
  max-height: min(680px, calc(100vh - 32px));
  display: flex;
  flex-direction: column;
  background: #141b24;
  border: 1px solid #232e3b;
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  animation: ${yuksel} 0.2s ease;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #232e3b;
    flex-wrap: wrap;
  }
  header h2 {
    margin: 0;
    font-size: 18px;
    color: #f3f6fa;
    flex: 1;
    min-width: 160px;
  }
  header button {
    appearance: none;
    border: 0;
    background: #1c2430;
    color: #c9d4e0;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
  }
  input[type='search'] {
    width: 100%;
    box-sizing: border-box;
    margin-top: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid #2e3b4b;
    background: #0b1017;
    color: #f3f6fa;
    font: inherit;
    font-size: 14px;
    outline: none;
  }
  input[type='search']:focus {
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
  }
  .izgara {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
    gap: 10px;
    padding: 16px 20px 20px;
    overflow-y: auto;
  }
  .izgara button {
    appearance: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 6px 12px;
    border-radius: 12px;
    border: 1px solid #232e3b;
    background: #0f151d;
    color: #c9d4e0;
    font: inherit;
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.15s;
  }
  .izgara button:hover,
  .izgara button:focus-visible {
    border-color: #14b8a6;
    background: #0f1f22;
    color: #f3f6fa;
    transform: translateY(-2px);
    outline: none;
  }
  .izgara button[aria-pressed='true'] {
    border-color: #2dd4bf;
    background: #112d2f;
    color: #5eead4;
    box-shadow: inset 0 0 0 1px #2dd4bf;
  }
  .izgara svg {
    color: #2dd4bf;
  }
  .bos {
    grid-column: 1 / -1;
    padding: 30px;
    text-align: center;
    color: #8a9bb0;
    font-size: 14px;
  }
`;

const kucuk = (s) => String(s).toLocaleLowerCase('tr');

const IkonSecici = React.forwardRef((props, ref) => {
  const { name, label, hint, required, disabled, error, value, onChange } = props;
  const [acik, setAcik] = React.useState(false);
  const [ara, setAra] = React.useState('');
  const araRef = React.useRef(null);
  const secili = HARITA[value];
  const liste = IKONLAR.filter((i) => !ara || kucuk(`${i.tr} ${i.ad}`).includes(kucuk(ara.trim())));

  React.useEffect(() => {
    if (!acik) return undefined;
    const esc = (e) => e.key === 'Escape' && setAcik(false);
    document.addEventListener('keydown', esc);
    const t = setTimeout(() => araRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', esc);
      clearTimeout(t);
    };
  }, [acik]);

  const sec = (ad) => {
    onChange(name, ad);
    setAcik(false);
    setAra('');
  };

  return (
    <Field.Root name={name} id={name} hint={hint} error={error} required={required}>
      <Field.Label>{label}</Field.Label>
      <Tetik ref={ref} type="button" disabled={disabled} $hata={!!error} onClick={() => setAcik(true)} aria-haspopup="dialog">
        <span className="kutu">{secili ? <Svg d={secili.d} /> : <span>?</span>}</span>
        <span className="ad">
          {secili ? secili.tr : 'İkon seçilmedi'}
          <small>{secili ? `Kod: ${secili.ad}` : 'Seçmek için tıklayın'}</small>
        </span>
        <span className="degistir">{secili ? 'Değiştir' : 'Seç'}</span>
      </Tetik>
      <Field.Hint />
      <Field.Error />
      {acik &&
        createPortal(
          <Kaplama onMouseDown={(e) => e.target === e.currentTarget && setAcik(false)}>
            <Pencere role="dialog" aria-modal="true" aria-label="İkon seç">
              <header>
                <h2>İkon seç{label ? ` · ${label}` : ''}</h2>
                <button type="button" onClick={() => setAcik(false)} aria-label="Kapat">
                  ×
                </button>
                <input ref={araRef} type="search" value={ara} onChange={(e) => setAra(e.target.value)} placeholder={`${IKONLAR.length} ikon içinde ara… (ör. sunucu, güvenlik, e-posta)`} />
              </header>
              <div className="izgara">
                {liste.map((i) => (
                  <button key={i.ad} type="button" aria-pressed={value === i.ad} onClick={() => sec(i.ad)} title={i.ad}>
                    <Svg d={i.d} boy={28} />
                    {i.tr}
                  </button>
                ))}
                {!liste.length && <div className="bos">Bu aramayla eşleşen ikon yok.</div>}
              </div>
            </Pencere>
          </Kaplama>,
          document.body
        )}
    </Field.Root>
  );
});

export default IkonSecici;
