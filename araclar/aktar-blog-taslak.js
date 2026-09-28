const fs = require('fs');
const path = require('path');

const KAPAK = { 'web-hosting': 70, 'sunucu-yonetimi': 71, wordpress: 70, 'alan-adi': 73, guvenlik: 73 };
const SINIR = { baslik: 110, ozet: 300, seoBaslik: 70, seoAciklama: 170 };
const YASAK = /[—–“”·]/;

function oku(dosya) {
  const ham = fs.readFileSync(dosya, 'utf8').replace(/\r\n/g, '\n');
  const ayrac = ham.indexOf('\n---\n');
  const bas = ham.slice(0, ayrac).split('\n');
  const icerik = ham.slice(ayrac + 5).trim();
  const v = { sss: [] };
  for (const satir of bas) {
    const i = satir.indexOf(': ');
    const k = satir.slice(0, i);
    const d = satir.slice(i + 2).trim();
    if (k === 'S') v.sss.push({ soru: d });
    else if (k === 'C') v.sss[v.sss.length - 1].cevap = d;
    else v[k] = d;
  }
  v.icerik = icerik;
  for (const [alan, s] of Object.entries(SINIR)) if ([...(v[alan] || '')].length > s) throw new Error(`${dosya} ${alan} ${[...v[alan]].length} > ${s}`);
  if (YASAK.test(ham)) throw new Error(`${dosya} yasak karakter`);
  return v;
}

(async () => {
  const klasor = process.argv[2];
  const dosyalar = fs.readdirSync(klasor).filter((f) => f.endsWith('.md')).sort();
  const yazilar = dosyalar.map((f) => oku(path.join(klasor, f)));
  if (process.argv[3] === '--kontrol') {
    for (const y of yazilar) console.log(y.slug, [...y.ozet].length, [...y.seoAciklama].length, y.sss.length);
    process.exit(0);
  }
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const app = await createStrapi(await compileStrapi()).load();
  const B = app.documents('api::blog-yazisi.blog-yazisi');
  const K = app.documents('api::blog-kategorisi.blog-kategorisi');
  const Y = app.documents('api::blog-yazari.blog-yazari');
  const yazar = await Y.findFirst({ filters: { slug: 'sunucumweb-ekibi' } });
  for (const y of yazilar) {
    if (await B.findFirst({ filters: { slug: y.slug }, status: 'draft' })) {
      console.log('var', y.slug);
      continue;
    }
    const kat = await K.findFirst({ filters: { slug: y.kategori } });
    const d = await B.create({
      data: {
        baslik: y.baslik,
        slug: y.slug,
        ozet: y.ozet,
        kapak: KAPAK[y.kategori],
        icerik: y.icerik,
        kategori: kat?.documentId,
        yazar: yazar?.documentId,
        etiketler: y.etiketler.split('|').join('\n'),
        oneCikan: y.oneCikan === 'true',
        seoBaslik: y.seoBaslik,
        seoAciklama: y.seoAciklama,
        sss: y.sss,
      },
    });
    console.log('taslak', d.documentId, y.slug);
  }
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
