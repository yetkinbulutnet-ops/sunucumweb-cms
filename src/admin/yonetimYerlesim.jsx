import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@strapi/design-system';
import YonetimMenusu from './panel/YonetimMenusu';

const CSS = `
.swb-cm-gizli{display:none!important}
li:has(> a[href="/admin/content-manager"]),a[href="/admin/content-manager"]{display:none!important}
html[data-swb-yonetim] a[href="/admin/yonetim"]{background:#112d2f!important;color:#2dd4bf!important}
html[data-swb-yonetim] a[href="/admin/yonetim"] svg path{fill:#2dd4bf!important}
.swb-ym{height:100vh}
@media (min-width:768px){.swb-ym{width:23.2rem;position:sticky;top:0}}
`;

let kok = null;
let kap = null;

const cmMenusu = () => [...document.querySelectorAll('nav[aria-label]:not(.swb-ym)')].find((n) => !n.closest('main') && !n.closest('#swb-ym-kok'));

const yerlestir = () => {
  const cm = location.pathname.startsWith('/admin/content-manager');
  const yonetim = cm || location.pathname.startsWith('/admin/yonetim');
  if (yonetim) document.documentElement.setAttribute('data-swb-yonetim', '');
  else document.documentElement.removeAttribute('data-swb-yonetim');

  if (kap && !kap.isConnected) {
    const eski = kok;
    kok = null;
    kap = null;
    setTimeout(() => eski?.unmount(), 0);
  }
  if (!cm) return;
  const nav = cmMenusu();
  if (nav && !nav.classList.contains('swb-cm-gizli')) nav.classList.add('swb-cm-gizli');
  if (kap || !nav || !nav.parentElement) return;
  kap = document.createElement('div');
  kap.id = 'swb-ym-kok';
  kap.style.height = '100%';
  nav.parentElement.insertBefore(kap, nav);
  kok = createRoot(kap);
  kok.render(
    <ThemeProvider theme={darkTheme}>
      <YonetimMenusu />
    </ThemeProvider>
  );
};

export const yonetimYerlesimBaslat = () => {
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
  let bekliyor = false;
  new MutationObserver(() => {
    if (bekliyor) return;
    bekliyor = true;
    requestAnimationFrame(() => {
      bekliyor = false;
      yerlestir();
    });
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('swb-yol', yerlestir);
  window.addEventListener('popstate', yerlestir);
};
