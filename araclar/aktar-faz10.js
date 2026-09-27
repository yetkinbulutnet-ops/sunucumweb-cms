const fs = require('fs');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const UID = 'api::ai-ayari.ai-ayari';
const ETIKET = {
  ad: ['Kayıt adı', ''],
  sistemTalimati: ['Sistem talimatı', 'Yapay zekânın rolü ve kuralları. DİKKAT: uzantı listesi kodda da denetlenir (.com .com.tr .net .org .co .app .dev .shop .online .xyz); burada başka uzantı yazmak öneri sayısını düşürür. label/tld/why/style alan adlarını değiştirmeyin, yanıt biçimi bunlara bağlıdır'],
  kullaniciSablonu: ['Kullanıcı mesajı şablonu', '{tanim} = ziyaretçinin yazdığı açıklama, {uzanti_satiri} = seçilen uzantılar satırı (seçim yoksa boş), {adet} = istenen öneri sayısı. Süslü parantezli alanları silmeyin'],
  uzantiSatiri: ['Uzantı satırı', 'Ziyaretçi uzantı seçtiyse şablondaki {uzanti_satiri} yerine yazılır; {uzantilar} = seçilen uzantılar'],
  jsonTalimati: ['Yedek model biçim talimatı', 'Ana model yanıt veremezse yedek modele sistem talimatının sonuna eklenir; {sema} = beklenen JSON şeması (silmeyin)'],
};

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const veri = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const S = app.documents(UID);
  const m = await S.findFirst();
  if (!m) await S.create({ data: veri });
  else if (process.argv.includes('--guncelle')) await S.update({ documentId: m.documentId, data: veri });

  const servis = app.plugin('content-manager').service('content-types');
  const tip = app.contentTypes[UID];
  const ayar = await servis.findConfiguration(tip);
  const metadatas = { ...ayar.metadatas };
  for (const [alan, [label, description]] of Object.entries(ETIKET)) {
    const x = metadatas[alan] || {};
    metadatas[alan] = { ...x, edit: { ...(x.edit || {}), label, description, placeholder: '' }, list: { ...(x.list || {}), label } };
  }
  const yeni = {
    ...ayar,
    metadatas,
    settings: { ...ayar.settings, mainField: 'ad' },
    layouts: { ...ayar.layouts, edit: ayar.layouts.edit.map((s) => s.filter((h) => h.name !== 'ad')).filter((s) => s.length).map((s) => s.map((h) => ({ ...h, size: 12 }))) },
  };
  delete yeni.uid;
  await servis.updateConfiguration(tip, yeni);
  const kontrol = await S.findFirst();
  console.log('faz10: ai ayari hazir, sistem talimati', kontrol.sistemTalimati.length, 'karakter');
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
