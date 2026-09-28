'use strict';

const LOGO = 'https://sunucumweb.com/icon/logo.png';
const SITE = 'https://sunucumweb.com';
const PANEL = 'https://cms.sunucumweb.com/admin';

const kacis = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const sarmal = ({ onBaslik, baslik, icerik, musteri = false, altBilgi = '' }) =>`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${kacis(baslik)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f5;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${kacis(onBaslik)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f5;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e1e7ee;">
<tr><td style="height:4px;background:#14b8a6;background-image:linear-gradient(90deg,#0d9488,#2dd4bf);font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px 32px;">
<img src="${LOGO}" width="170" alt="SunucumWEB" style="display:block;width:170px;max-width:60%;height:auto;border:0;">
</td></tr>
<tr><td style="padding:12px 32px 28px 32px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#33506e;font-size:15px;line-height:1.6;">
<h1 style="margin:0 0 14px 0;font-size:21px;line-height:1.3;color:#0f2942;font-weight:700;">${kacis(baslik)}</h1>
${icerik}
</td></tr>
<tr><td style="padding:18px 32px;background:#f6f8fa;border-top:1px solid #e1e7ee;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#76869b;">
${altBilgi ? `${altBilgi}<br>` : musteri ? 'Bu e-posta, sunucumweb.com çark kampanyasına katıldığınız için gönderildi.<br>' : `Bu e-posta <a href="${PANEL}" style="color:#0d9488;text-decoration:none;">SunucumWEB Admin</a> tarafından otomatik gönderildi, lütfen yanıtlamayın.<br>`}
<a href="${SITE}" style="color:#76869b;text-decoration:none;">sunucumweb.com</a> | YetkinWeb Systems
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const paragraf = (html) => `<p style="margin:0 0 14px 0;">${html}</p>`;

const bilgiTablosu = (satirlar) => {
  const r = satirlar
    .filter(([, d]) => d)
    .map(
      ([e, d]) =>
        `<tr><td style="padding:7px 12px;color:#76869b;font-size:13px;white-space:nowrap;vertical-align:top;">${kacis(e)}</td><td style="padding:7px 12px;color:#0f2942;font-size:13px;font-weight:600;word-break:break-word;">${kacis(d)}</td></tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px 0;background:#f6f8fa;border:1px solid #e1e7ee;border-radius:10px;">${r}</table>`;
};

const buton = (url, yazi) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px 0;"><tr><td style="border-radius:8px;background:#0d9488;"><a href="${kacis(url)}" style="display:inline-block;padding:12px 22px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${kacis(yazi)}</a></td></tr></table>`;

const uyari = (html) =>
  `<p style="margin:0 0 14px 0;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412;font-size:13px;">${html}</p>`;

const oturumSatirlari = (o) => [
  ['Tarih', o.tarih],
  ['Cihaz', o.cihaz],
  ['IP adresi', o.ip],
  ['Konum', o.konum],
];

const duz = (html) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|tr|h1|table|div)>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

const paket = (subject, onBaslik, baslik, icerik, musteri = false, altBilgi = '') => {
  const html = sarmal({ onBaslik, baslik, icerik, musteri, altBilgi });
  const imza = musteri ? 'SunucumWEB | sunucumweb.com' : 'SunucumWEB Admin | YetkinWeb Systems';
  return { subject, html, text: duz(`${baslik}\n\n${icerik}\n\n${imza}`) };
};

const carkKuponu = ({ odul, aciklama, kupon, gecerlilik, baglanti }) =>
  paket(
    `Tebrikler, ${odul} kazandın | SunucumWEB`,
    `Kupon kodun: ${kupon}`,
    `Tebrikler, ${odul} kazandın!`,
    paragraf('SunucumWEB çarkını çevirdin ve ödülü kaptın. Kupon kodunu sipariş sırasında kullanabilirsin:') +
      `<p style="margin:4px 0 18px 0;"><span style="display:inline-block;padding:14px 22px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;font-family:Consolas,Menlo,monospace;font-size:24px;font-weight:700;letter-spacing:2px;color:#0f766e;">${kacis(kupon)}</span></p>` +
      (aciklama ? paragraf(kacis(aciklama)) : '') +
      bilgiTablosu([
        ['Ödül', odul],
        ['Geçerlilik', gecerlilik],
      ]) +
      buton(baglanti && /^https?:\/\//.test(baglanti) ? baglanti : `${SITE}${baglanti || '/kampanyalar'}`, 'Hemen kullan') +
      paragraf('<span style="font-size:13px;color:#76869b;">Kupon kodu tek kullanımlıktır ve başkasına devredilemez.</span>'),
    true
  );

const cokSatir = (metin) => kacis(metin).replace(/\r?\n/g, '<br>');
const tarihTr = (d) => new Date(d || Date.now()).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' });

const yeniMesaj = ({ t, m, baglanti }) => {
  const konu = m.konuAdi || m.konu || '-';
  return paket(
    t('eposta.mesaj_bildirim_konu', { konu, ad: m.ad }, `Yeni iletişim mesajı: ${konu} (${m.ad})`),
    `${m.ad}: ${String(m.mesaj).slice(0, 90)}`,
    t('eposta.mesaj_bildirim_baslik', null, 'Yeni bir iletişim mesajı var'),
    paragraf(kacis(t('eposta.mesaj_bildirim_giris', null, 'sunucumweb.com iletişim formundan yeni bir mesaj geldi:'))) +
      bilgiTablosu([
        [t('eposta.mesaj_etiket_ad', null, 'Ad soyad'), m.ad],
        [t('eposta.mesaj_etiket_eposta', null, 'E-posta'), m.eposta],
        [t('eposta.mesaj_etiket_telefon', null, 'Telefon'), m.telefon],
        [t('eposta.mesaj_etiket_konu', null, 'Konu'), konu],
        [t('eposta.mesaj_etiket_tarih', null, 'Tarih'), tarihTr(m.createdAt)],
        [t('eposta.mesaj_etiket_ip', null, 'IP adresi'), m.ip],
      ]) +
      `<div style="margin:0 0 18px 0;padding:16px 18px;background:#f6f8fa;border-left:4px solid #14b8a6;border-radius:8px;color:#0f2942;font-size:15px;line-height:1.6;">${cokSatir(m.mesaj)}</div>` +
      buton(baglanti, t('eposta.mesaj_bildirim_buton', null, 'Panelde görüntüle ve yanıtla')) +
      paragraf(`<span style="font-size:13px;color:#76869b;">${kacis(t('eposta.mesaj_bildirim_not', null, 'Bu e-postayı doğrudan yanıtlarsanız yanıtınız müşteriye gider. Panelden yanıtlarsanız yanıt, mesaj geçmişine de kaydedilir.'))}</span>`)
  );
};

const mesajYaniti = ({ t, m, yanit, gonderenAd }) => {
  const konu = m.konuAdi || m.konu || 'Mesajınız';
  return paket(
    t('eposta.mesaj_yanit_konu', { konu }, `Re: ${konu}`),
    String(yanit).slice(0, 90),
    t('eposta.mesaj_yanit_baslik', { konu }, `Mesajınız hakkında: ${konu}`),
    paragraf(kacis(t('eposta.mesaj_yanit_selam', { ad: m.ad }, `Merhaba ${m.ad},`))) +
      `<div style="margin:0 0 18px 0;color:#0f2942;font-size:15px;line-height:1.7;">${cokSatir(yanit)}</div>` +
      paragraf(`<strong style="color:#0f2942;">${kacis(gonderenAd)}</strong><br>${kacis(t('eposta.mesaj_yanit_imza', null, 'SunucumWEB Müşteri Hizmetleri'))}`) +
      `<div style="margin:22px 0 4px 0;padding:14px 16px;background:#f6f8fa;border-left:3px solid #c9d4e0;border-radius:8px;color:#76869b;font-size:13px;line-height:1.6;"><div style="margin-bottom:6px;font-weight:600;">${kacis(t('eposta.mesaj_yanit_alinti', { tarih: tarihTr(m.createdAt) }, `${tarihTr(m.createdAt)} tarihinde gönderdiğiniz mesaj:`))}</div>${cokSatir(m.mesaj)}</div>`,
    true,
    kacis(t('eposta.mesaj_yanit_alt_bilgi', null, 'Bu e-posta, sunucumweb.com iletişim formundan gönderdiğiniz mesaja yanıt olarak gönderildi.'))
  );
};

const bultenOnay = ({ t, onayUrl, iptalUrl }) =>
  paket(
    t('eposta.bulten_konu', null, 'E-posta aboneliğini onayla | SunucumWEB'),
    t('eposta.bulten_on_baslik', null, 'Kampanya ve duyurularımızı almak için tek adım kaldı.'),
    t('eposta.bulten_baslik', null, 'Aboneliğini onayla'),
    paragraf(kacis(t('eposta.bulten_metin', null, 'SunucumWEB kampanya, fırsat ve duyurularından haberdar olmak için bu e-posta adresiyle abonelik isteği aldık. Aboneliğini başlatmak için aşağıdaki butona tıkla:'))) +
      buton(onayUrl, t('eposta.bulten_buton', null, 'Aboneliğimi onayla')) +
      paragraf(`${kacis(t('eposta.bulten_yedek', null, 'Buton çalışmıyorsa şu bağlantıyı tarayıcına yapıştır:'))}<br><span style="word-break:break-all;color:#0d9488;">${kacis(onayUrl)}</span>`) +
      uyari(kacis(t('eposta.bulten_uyari', null, 'Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; onaylamadığın sürece listeye eklenmezsin.'))),
    true,
    `${kacis(t('eposta.bulten_alt_bilgi', null, "Bu e-postayı, sunucumweb.com'da bülten aboneliği istendiği için aldınız."))} <a href="${kacis(iptalUrl)}" style="color:#0d9488;text-decoration:none;">${kacis(t('eposta.bulten_iptal', null, 'Abonelikten çık'))}</a>`
  );

const dogrulamaKodu = ({ ad, kod, dakika, oturum, digerCihaz }) =>
  paket(
    `${kod}: SunucumWEB Admin giriş doğrulama kodunuz`,
    `Giriş doğrulama kodunuz: ${kod}`,
    'Giriş doğrulama kodunuz',
    paragraf(`Merhaba ${kacis(ad)},`) +
      paragraf('SunucumWEB Admin hesabınıza yeni bir cihazdan giriş yapılmak isteniyor. Girişi tamamlamak için aşağıdaki kodu kullanın:') +
      `<p style="margin:4px 0 18px 0;"><span style="display:inline-block;padding:14px 22px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;font-family:Consolas,Menlo,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:#0f766e;">${kacis(kod)}</span></p>` +
      paragraf(`Kod <strong>${dakika} dakika</strong> geçerlidir ve yalnızca bir kez kullanılabilir.`) +
      bilgiTablosu(oturumSatirlari(oturum)) +
      (digerCihaz ? uyari(`Hesabınız şu anda başka bir cihazda açık${typeof digerCihaz === 'string' ? ` (${kacis(digerCihaz)})` : ''}. Doğrulama tamamlanırsa o cihazdaki oturum kapatılacak ve bu cihaz hesabınızın tek kayıtlı cihazı olacak.`) : '') +
      uyari('Bu girişi siz yapmıyorsanız kodu kimseyle paylaşmayın ve şifrenizi hemen değiştirin.')
  );

const yeniCihaz = ({ ad, oturum, eskiCihaz }) =>
  paket(
    'SunucumWEB Admin: hesabınıza yeni bir cihaz kaydedildi',
    'Hesabınız yeni bir cihaza taşındı, önceki cihazdaki oturum kapatıldı.',
    'Hesabınıza yeni bir cihaz kaydedildi',
    paragraf(`Merhaba ${kacis(ad)},`) +
      paragraf('Hesabınıza aşağıdaki cihazdan e-posta doğrulamasıyla giriş yapıldı. Hesap başına yalnızca bir cihaz tanımlanabildiği için bu cihaz artık kayıtlı cihazınızdır.') +
      bilgiTablosu(oturumSatirlari(oturum)) +
      (eskiCihaz ? paragraf(`Önceki cihazınızdaki (${kacis(eskiCihaz)}) oturum sonlandırıldı.`) : '') +
      uyari('Bu işlemi siz yapmadıysanız hemen şifrenizi değiştirin ve yöneticinizle iletişime geçin.') +
      buton(PANEL, 'Panele git')
  );

const sifreDegisti = ({ ad, oturum }) =>
  paket(
    'SunucumWEB Admin: şifreniz değiştirildi',
    'Hesap şifreniz başarıyla değiştirildi.',
    'Şifreniz değiştirildi',
    paragraf(`Merhaba ${kacis(ad)},`) +
      paragraf('SunucumWEB Admin hesabınızın şifresi değiştirildi. Güvenliğiniz için tüm cihazlardaki oturumlar kapatıldı; yeni şifrenizle tekrar giriş yapmanız gerekiyor.') +
      bilgiTablosu(oturumSatirlari(oturum)) +
      uyari('Bu değişikliği siz yapmadıysanız hemen yöneticinizle iletişime geçin.') +
      buton(`${PANEL}/auth/login`, 'Giriş yap')
  );

const smtpTest = ({ alici }) =>
  paket(
    'SunucumWEB Admin: e-posta ayarları test iletisi',
    'E-posta gönderimi başarıyla çalışıyor.',
    'E-posta gönderimi çalışıyor',
    paragraf('Bu bir test iletisidir. SunucumWEB Admin e-posta (SMTP) ayarları doğru yapılandırılmış ve iletiler başarıyla gönderiliyor.') +
      bilgiTablosu([
        ['Alıcı', alici],
        ['Tarih', new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })],
      ])
  );

const sifreSifirlamaSablonu = () => {
  const icerik =
    paragraf('Merhaba <%= user.firstname %>,') +
    paragraf('SunucumWEB Admin hesabınız için şifre sıfırlama talebi aldık. Yeni şifre belirlemek için aşağıdaki butona tıklayın:') +
    buton('URL_YER', 'Şifremi sıfırla') +
    paragraf('Buton çalışmıyorsa şu bağlantıyı tarayıcınıza yapıştırın:<br><span style="word-break:break-all;color:#0d9488;">URL_METIN</span>') +
    uyari('Bu talebi siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmeyecek.');
  const html = sarmal({ onBaslik: 'Şifre sıfırlama bağlantınız', baslik: 'Şifre sıfırlama talebi', icerik })
    .replace('href="URL_YER"', 'href="<%= url %>"')
    .replace('URL_METIN', '<%= url %>');
  return {
    subject: 'SunucumWEB Admin: şifre sıfırlama talebi',
    text: 'Merhaba <%= user.firstname %>,\n\nSunucumWEB Admin hesabınız için şifre sıfırlama talebi aldık. Yeni şifre belirlemek için şu bağlantıyı açın:\n<%= url %>\n\nBu talebi siz yapmadıysanız bu e-postayı yok sayın.\n\nSunucumWEB Admin | YetkinWeb Systems',
    html,
  };
};

module.exports = { yeniMesaj, mesajYaniti, bultenOnay, carkKuponu, dogrulamaKodu, yeniCihaz, sifreDegisti, smtpTest, sifreSifirlamaSablonu };
