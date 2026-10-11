'use strict';

const fs = require('fs/promises');
const { pipeline } = require('stream/promises');
const { Transform } = require('stream');
const path = require('path');
const sharp = require('sharp');
const { errors } = require('@strapi/utils');

const WEBP_YAP = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/avif', 'image/heif', 'image/heic']);
const FORMAT_ONEKI = /^(thumbnail|small|medium|large|xlarge)_(.+)$/;
const HARF = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', đ: 'd', ł: 'l' };
const AD_SINIRI = 80;
const BEKLEME_MS = 30000;

const adTemizle = (ham) => {
  let s = String(ham || '').replace(/İ/g, 'i').toLowerCase();
  s = s.replace(/[çğıöşüâîûßæøœđł]/g, (h) => HARF[h] || h);
  s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[\s_]+/g, '_').replace(/[^a-z0-9_-]+/g, '_');
  s = s.replace(/_{2,}/g, '_').replace(/[_-]*-[_-]*/g, '-').replace(/^[_-]+|[_-]+$/g, '');
  if (s.length > AD_SINIRI) s = s.slice(0, AD_SINIRI).replace(/[_-]+$/g, '');
  return s || 'dosya';
};

const uzantiTemizle = (ext) => {
  const e = String(ext || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  return /^\.[a-z0-9]{1,8}$/.test(e) ? e : '';
};

const MIME_UZANTI = {
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/x-icon': ['.ico'],
  'image/vnd.microsoft.icon': ['.ico'],
  'video/mp4': ['.mp4', '.m4v'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/ogg': ['.ogv'],
  'audio/mpeg': ['.mp3'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg', '.oga'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/webm': ['.weba'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

const uzantiBelirle = (ext, mime) => {
  const izinli = MIME_UZANTI[mime];
  if (!izinli) return '.bin';
  const e = uzantiTemizle(ext);
  return izinli.includes(e) ? e : izinli[0];
};

const akisiOku = async (akis) => {
  const parcalar = [];
  for await (const p of akis) parcalar.push(typeof p === 'string' ? Buffer.from(p) : p);
  return Buffer.concat(parcalar);
};

const bekleyenler = new Map();

const kayitKur = (hash) => {
  let coz;
  const soz = new Promise((r) => {
    coz = r;
  });
  const k = { soz, coz };
  bekleyenler.set(hash, k);
  setTimeout(() => {
    coz(null);
    if (bekleyenler.get(hash) === k) bekleyenler.delete(hash);
  }, BEKLEME_MS).unref();
  return k;
};

const kayitAl = (hash) => bekleyenler.get(hash) || kayitKur(hash);

const anaDosyaMi = (file) => 'folderPath' in file || 'alternativeText' in file || 'related' in file;

module.exports = {
  init(ayar = {}) {
    const kok = path.resolve(ayar.kok);
    const klasor = String(ayar.klasor || 'system-uploads').replace(/^\/+|\/+$/g, '');
    const taban = String(ayar.taban).replace(/\/+$/, '');
    const kalite = Number(ayar.kalite) || 82;
    const hedefDizin = path.join(kok, klasor);

    const benzersizYaz = async (taban_ad, ext, yazici) => {
      await fs.mkdir(hedefDizin, { recursive: true, mode: 0o2775 });
      for (let n = 1; n < 10000; n++) {
        const ad = `${taban_ad}${n > 1 ? `-${n}` : ''}`;
        const hedef = path.join(hedefDizin, `${ad}${ext}`);
        let el;
        try {
          el = await fs.open(hedef, 'wx', 0o664);
        } catch (h) {
          if (h.code === 'EEXIST') continue;
          throw h;
        }
        try {
          const boyut = await yazici(el);
          return { ad, boyut };
        } catch (h) {
          await el.close().catch(() => {});
          await fs.rm(hedef, { force: true });
          throw h;
        }
      }
      throw new errors.ApplicationError('Dosya için boş ad bulunamadı');
    };

    const yaz = async (file, veriAl, kayit) => {
      const eslesme = !kayit && FORMAT_ONEKI.exec(String(file.hash || ''));

      try {
        const mime = String(file.mime || '').toLowerCase();
        let ext = uzantiBelirle(file.ext, mime);
        const donustur = WEBP_YAP.has(mime);
        let icerik = null;

        if (donustur) {
          icerik = await sharp(await veriAl(), { failOn: 'none' }).rotate().webp({ quality: kalite, effort: 5 }).toBuffer();
          ext = '.webp';
          file.mime = 'image/webp';
        }

        let tabanAd;
        if (eslesme) {
          const anaAd = await kayitAl(eslesme[2]).soz;
          const adKaynak = String(file.name || '').replace(new RegExp(`^${eslesme[1]}_`), '');
          tabanAd = `${anaAd || adTemizle(path.parse(adKaynak).name)}_${eslesme[1]}`;
        } else {
          tabanAd = adTemizle(path.parse(String(file.name || '')).name);
        }

        const sonuc = await benzersizYaz(tabanAd, ext, async (el) => {
          if (icerik) {
            await el.writeFile(icerik);
            await el.close();
            return icerik.length;
          }
          if (file.stream) {
            let sayac = 0;
            const olcer = new Transform({
              transform(p, _k, cb) {
                sayac += p.length;
                cb(null, p);
              },
            });
            await pipeline(file.stream, olcer, el.createWriteStream());
            return sayac;
          }
          const tampon = await veriAl();
          await el.writeFile(tampon);
          await el.close();
          return tampon.length;
        });

        if (kayit) kayit.coz(sonuc.ad);

        const goreli = `${klasor}/${sonuc.ad}${ext}`;
        file.ext = ext;
        file.size = Math.round((sonuc.boyut / 1000) * 100) / 100;
        if ('sizeInBytes' in file) file.sizeInBytes = sonuc.boyut;
        file.url = `${taban}/${goreli}`;
        file.provider_metadata = { ...(file.provider_metadata || {}), yol: goreli };
      } catch (h) {
        if (kayit) kayit.coz(null);
        throw h;
      }
    };

    const yolBul = (file) => {
      let goreli = file.provider_metadata && file.provider_metadata.yol;
      if (!goreli && file.url && file.url.startsWith(`${taban}/`)) goreli = file.url.slice(taban.length + 1);
      if (!goreli) return null;
      const tam = path.resolve(kok, goreli);
      return tam.startsWith(kok + path.sep) ? tam : null;
    };

    const akisVerisi = (file) => {
      let tampon = null;
      return async () => {
        if (!tampon) tampon = await akisiOku(file.stream);
        return tampon;
      };
    };

    const anaKayit = (file) => (anaDosyaMi(file) ? kayitKur(file.hash) : null);

    const sil = async (file) => {
      const tam = yolBul(file);
      if (!tam) return;
      await fs.rm(tam, { force: true });
      for (let d = path.dirname(tam); d !== kok && d !== hedefDizin && d.startsWith(kok + path.sep); d = path.dirname(d)) {
        try {
          await fs.rmdir(d);
        } catch {
          break;
        }
      }
    };

    return {
      async upload(file) {
        const kayit = anaKayit(file);
        await yaz(file, async () => file.buffer, kayit);
      },
      async uploadStream(file) {
        const kayit = anaKayit(file);
        await yaz(file, akisVerisi(file), kayit);
      },
      async replaceStream(file, eski) {
        const kayit = anaKayit(file);
        try {
          await sil(eski);
        } catch (h) {
          if (kayit) kayit.coz(null);
          throw h;
        }
        file.provider_metadata = null;
        await yaz(file, akisVerisi(file), kayit);
      },
      async delete(file) {
        await sil(file);
      },
      checkFileSize(file, { sizeLimit }) {
        const limit = sizeLimit || ayar.sizeLimit;
        if (limit && file.size * 1000 > limit) {
          throw new errors.PayloadTooLargeError(`Dosya boyutu sınırı aşıldı (${Math.round(limit / 1024 / 1024)} MB)`);
        }
      },
      isPrivate() {
        return false;
      },
    };
  },
};
