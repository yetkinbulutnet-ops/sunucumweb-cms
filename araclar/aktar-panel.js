const fs = require('fs/promises');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const HARF = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', đ: 'd', ł: 'l' };
const adTemizle = (ham) => {
  let s = String(ham || '').replace(/İ/g, 'i').toLowerCase();
  s = s.replace(/[çğıöşüâîûßæøœđł]/g, (h) => HARF[h] || h);
  s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[\s_]+/g, '_').replace(/[^a-z0-9_-]+/g, '_');
  s = s.replace(/_{2,}/g, '_').replace(/[_-]*-[_-]*/g, '-').replace(/^[_-]+|[_-]+$/g, '');
  if (s.length > 80) s = s.slice(0, 80).replace(/[_-]+$/g, '');
  return s || 'dosya';
};

const ETIKET = {
  'api::iletisim-mesaji.iletisim-mesaji': {
    ad: ['Ad soyad', ''],
    eposta: ['E-posta', ''],
    telefon: ['Telefon', ''],
    konu: ['Konu kodu', 'Formdaki konunun teknik kodu'],
    konuAdi: ['Konu', ''],
    mesaj: ['Mesaj', ''],
    durum: ['Durum', 'yeni · okundu · yanitlandi · arsiv — yanıtlamak için sol menüdeki Gelen Mesajlar sayfasını kullanın'],
    okunmaTarihi: ['Okunma tarihi', ''],
    sonYanitTarihi: ['Son yanıt tarihi', ''],
    yanitlar: ['Yanıt geçmişi', 'Gelen Mesajlar sayfasından gönderilen yanıtlar'],
    ip: ['IP adresi', ''],
    tarayici: ['Tarayıcı bilgisi', ''],
    notlar: ['Not', 'Sadece panelde görünür'],
  },
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const kok = path.resolve(process.env.STORAGE_ROOT || '/home/sunucumweb-storage/htdocs/storage.sunucumweb.com');
  const taban = (process.env.STORAGE_URL || 'https://storage.sunucumweb.com').replace(/\/+$/, '');
  const hedef = path.join(kok, 'system-uploads');

  const cm = app.plugin('content-manager').service('content-types');
  for (const [uid, alanlar] of Object.entries(ETIKET)) {
    const tip = app.contentTypes[uid];
    const ay = await cm.findConfiguration(tip);
    const metadatas = { ...ay.metadatas };
    for (const [alan, [label, description]] of Object.entries(alanlar)) {
      const m = metadatas[alan] || {};
      metadatas[alan] = { ...m, edit: { ...(m.edit || {}), label, description, placeholder: m.edit?.placeholder || '' }, list: { ...(m.list || {}), label } };
    }
    for (const alan of ['yanitlar', 'okunmaTarihi', 'sonYanitTarihi', 'ip', 'tarayici']) metadatas[alan] = { ...metadatas[alan], edit: { ...metadatas[alan].edit, editable: false } };
    const yeni = { ...ay, metadatas, settings: { ...ay.settings, mainField: 'ad', defaultSortBy: 'createdAt', defaultSortOrder: 'DESC', pageSize: 20 }, layouts: { ...ay.layouts, list: ['ad', 'konuAdi', 'durum', 'eposta', 'createdAt'] } };
    delete yeni.uid;
    await cm.updateConfiguration(tip, yeni);
  }

  const S = app.documents('api::arayuz-metni.arayuz-metni');
  const t = await S.findFirst({ filters: { anahtar: 'cark.tekrar_cevir' } });
  if (t && t.metin === 'Tekrar çevir') await S.update({ documentId: t.documentId, data: { metin: 'Tekrar dene', konum: 'PAS sonrası tekrar deneme butonu' } });

  const FQ = app.db.query('plugin::upload.folder');
  let klasor = await FQ.findOne({ where: { name: 'system-uploads', parent: null } });
  if (!klasor) klasor = await app.plugin('upload').service('folder').create({ name: 'system-uploads', parent: null });

  const Q = app.db.query('plugin::upload.file');
  const dosyalar = await Q.findMany({ populate: ['folder'], limit: 10000 });
  let klasoreAlinan = 0;
  let tasinan = 0;
  const silinecek = [];
  const yazBenzersiz = async (tabanAd, ext, kaynak) => {
    for (let n = 1; n < 1000; n++) {
      const ad = `${tabanAd}${n > 1 ? `-${n}` : ''}`;
      const yol = path.join(hedef, `${ad}${ext}`);
      try {
        await fs.copyFile(kaynak, yol, fs.constants.COPYFILE_EXCL);
        await fs.chmod(yol, 0o664);
        return ad;
      } catch (h) {
        if (h.code === 'EEXIST') continue;
        throw h;
      }
    }
    throw new Error('ad bulunamadi');
  };
  const goreliYol = (url) => (url && url.startsWith(`${taban}/`) ? url.slice(taban.length + 1) : null);

  for (const d of dosyalar) {
    const veri = {};
    if (!d.folder) {
      veri.folder = klasor.id;
      veri.folderPath = klasor.path;
      klasoreAlinan++;
    }
    const goreli = goreliYol(d.url);
    if (goreli && !goreli.startsWith('system-uploads/')) {
      const ext = path.extname(goreli).toLowerCase();
      const anaAd = await yazBenzersiz(adTemizle(path.parse(d.name || 'dosya').name), ext, path.join(kok, goreli));
      veri.url = `${taban}/system-uploads/${anaAd}${ext}`;
      veri.provider_metadata = { ...(d.provider_metadata || {}), yol: `system-uploads/${anaAd}${ext}` };
      silinecek.push(goreli);
      if (d.formats && typeof d.formats === 'object') {
        const f = {};
        for (const [k, v] of Object.entries(d.formats)) {
          const fg = goreliYol(v.url);
          if (!fg || fg.startsWith('system-uploads/')) {
            f[k] = v;
            continue;
          }
          const fext = path.extname(fg).toLowerCase();
          const fad = await yazBenzersiz(`${anaAd}_${k}`, fext, path.join(kok, fg));
          f[k] = { ...v, url: `${taban}/system-uploads/${fad}${fext}`, provider_metadata: { ...(v.provider_metadata || {}), yol: `system-uploads/${fad}${fext}` } };
          silinecek.push(fg);
        }
        veri.formats = f;
      }
      tasinan++;
    }
    if (Object.keys(veri).length) await Q.update({ where: { id: d.id }, data: veri });
  }
  await fs.writeFile(path.join(process.cwd(), 'araclar', 'eski-dosyalar.json'), JSON.stringify(silinecek));
  console.log(`klasore alinan: ${klasoreAlinan}, okunur ada tasinan: ${tasinan}, eski dosya: ${silinecek.length}`);

  await new Promise((r) => setTimeout(r, 4000));
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
