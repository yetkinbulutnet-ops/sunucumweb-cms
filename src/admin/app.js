import logoYatay from './extensions/logo-yatay.png';
import logoIkon from './extensions/logo-ikon.png';
import tr from './tr.json';
import React from 'react';
import { Shield, ChartPie, Mail, SquaresFour, Gift, Lightning, Star } from '@strapi/icons';
import { guvenlikBaslat, oturumSayfasiCiz } from './guvenlik';
import { telefonBaslat } from './telefon';

const MARKA = 'SunucumWEB Admin';

try {
  localStorage.setItem('strapi-admin-language', 'tr');
  localStorage.setItem('STRAPI_THEME', 'dark');
} catch {}

const gizleCss = `
a[href*="strapi.io"],
a[href*="github.com/strapi"],
a[href*="discord.strapi"],
a[href*="feedback.strapi"],
a[href$="/marketplace"],
a[href*="market.strapi"],
a[href$="/settings/transfer-tokens"],
a[href$="/settings/admin-tokens"],
a[href$="/settings/list-plugins"],
a[href$="/settings/internationalization"],
li:has(> a[href$="/settings/transfer-tokens"]),
li:has(> a[href$="/settings/admin-tokens"]),
li:has(> a[href$="/settings/list-plugins"]),
li:has(> a[href$="/settings/internationalization"]),
li:has(> a[href$="/marketplace"]),
a[href$="/plugins/content-type-builder"],
li:has(> a[href$="/plugins/content-type-builder"]) {
  display: none !important;
}
img[src*="logo-yatay"] {
  height: auto !important;
  width: 180px !important;
  max-width: 60vw !important;
}
`;

const basligiDuzelt = () => {
  const t = document.title;
  if (/strapi/i.test(t)) document.title = t.replace(/Strapi( Admin)?/gi, MARKA);
};

const OturumSayfasi = () => {
  const kok = React.useRef(null);
  React.useEffect(() => {
    if (kok.current) oturumSayfasiCiz(kok.current);
  }, []);
  return React.createElement('div', { ref: kok });
};

export default {
  register(app) {
    app.customFields.register({
      name: 'ikon',
      type: 'string',
      intlLabel: { id: 'swb.alan.ikon', defaultMessage: 'İkon' },
      intlDescription: { id: 'swb.alan.ikon.aciklama', defaultMessage: 'Görsel ikon seçici' },
      icon: Star,
      components: { Input: async () => import('./panel/IkonSecici') },
    });
    const w = (ad) => async () => (await import('./panel/widgetlar'))[ad];
    app.widgets.register((mevcut) => [
      { id: 'swb-trafik', icon: ChartPie, title: { id: 'swb.widget.trafik', defaultMessage: 'Site trafiği' }, link: { label: { id: 'swb.widget.trafik.link', defaultMessage: 'Tüm istatistikler' }, href: '/istatistikler' }, component: w('TrafikWidget') },
      { id: 'swb-mesaj', icon: Mail, title: { id: 'swb.widget.mesaj', defaultMessage: 'Gelen mesajlar' }, link: { label: { id: 'swb.widget.mesaj.link', defaultMessage: 'Tümünü aç' }, href: '/mesajlar' }, component: w('MesajWidget') },
      { id: 'swb-pazarlama', icon: Gift, title: { id: 'swb.widget.pazarlama', defaultMessage: 'Çark ve bülten' }, link: { label: { id: 'swb.widget.pazarlama.link', defaultMessage: 'Yönet' }, href: '/yonetim' }, component: w('PazarlamaWidget') },
      { id: 'swb-kisayol', icon: Lightning, title: { id: 'swb.widget.kisayol', defaultMessage: 'Hızlı erişim' }, link: { label: { id: 'swb.widget.kisayol.link', defaultMessage: 'Tüm bölümler' }, href: '/yonetim' }, component: w('KisayolWidget') },
      ...mevcut.filter((x) => x.id === 'last-edited-entries'),
    ]);
    app.addMenuLink({
      to: 'yonetim',
      icon: SquaresFour,
      intlLabel: { id: 'swb.menu.yonetim', defaultMessage: 'Site Yönetimi' },
      Component: () => import('./panel/Yonetim'),
      permissions: [],
      position: 1,
    });
    app.addMenuLink({
      to: 'mesajlar',
      icon: Mail,
      intlLabel: { id: 'swb.menu.mesajlar', defaultMessage: 'Gelen Mesajlar' },
      Component: () => import('./panel/Mesajlar'),
      permissions: [],
      position: 2,
    });
    app.addMenuLink({
      to: 'istatistikler',
      icon: ChartPie,
      intlLabel: { id: 'swb.menu.istatistikler', defaultMessage: 'İstatistikler' },
      Component: () => import('./panel/Istatistikler'),
      permissions: [],
      position: 3,
    });
    app.addMenuLink({
      to: 'oturum-guvenligi',
      icon: Shield,
      intlLabel: { id: 'swb.oturum-guvenligi', defaultMessage: 'Oturum Güvenliği' },
      Component: () => Promise.resolve({ default: OturumSayfasi }),
      permissions: [],
      position: 8,
    });
  },
  config: {
    locales: ['tr'],
    auth: { logo: logoYatay },
    menu: { logo: logoIkon },
    tutorials: false,
    notifications: { releases: false },
    translations: { tr },
    theme: {
      dark: {
        colors: {
          primary100: '#112d2f',
          primary200: '#184444',
          primary500: '#2dd4bf',
          primary600: '#14b8a6',
          primary700: '#2dd4bf',
          buttonPrimary500: '#14b8a6',
          buttonPrimary600: '#0d9488',
          neutral0: '#141b24',
          neutral100: '#0b1017',
          neutral150: '#232e3b',
          neutral200: '#2e3b4b',
          neutral300: '#3d4d60',
          neutral400: '#6b7d91',
          neutral500: '#8a9bb0',
          neutral600: '#9fb0c2',
          neutral700: '#c9d4e0',
          neutral800: '#e8eef5',
          neutral900: '#f3f6fa',
          neutral1000: '#0b1017',
        },
      },
    },
  },
  bootstrap() {
    telefonBaslat();
    const yonlendir = () => {
      if (/\/content-manager\/single-types\/api::ai-ayari\.ai-ayari\/?$/.test(location.pathname)) {
        history.replaceState(history.state, '', '/admin/yonetim/yapay-zeka');
        window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
      }
    };
    let sonYol = '';
    new MutationObserver(() => {
      if (location.pathname !== sonYol) {
        sonYol = location.pathname;
        yonlendir();
      }
    }).observe(document.body, { childList: true, subtree: true });
    const stil = document.createElement('style');
    stil.textContent = gizleCss;
    document.head.appendChild(stil);
    document.documentElement.lang = 'tr';
    basligiDuzelt();
    const baslik = document.querySelector('title');
    if (baslik) new MutationObserver(basligiDuzelt).observe(baslik, { childList: true, characterData: true, subtree: true });
    guvenlikBaslat();
  },
};
