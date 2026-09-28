const { createStrapi, compileStrapi } = require('@strapi/strapi');

const duzelt = (s) =>
  typeof s !== 'string'
    ? s
    : s
        .replace(/\s+[—–]\s+/g, ', ')
        .replace(/\s+·\s+/g, ', ')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  const cm = app.plugin('content-manager');
  let n = 0;
  const isle = async (servis, tip) => {
    const ay = await servis.findConfiguration(tip);
    const metadatas = { ...ay.metadatas };
    let degisti = false;
    for (const [alan, m] of Object.entries(metadatas)) {
      const edit = { ...(m.edit || {}) };
      for (const k of ['label', 'description', 'placeholder']) {
        const y = duzelt(edit[k]);
        if (y !== edit[k]) {
          edit[k] = y;
          degisti = true;
          n++;
        }
      }
      metadatas[alan] = { ...m, edit };
    }
    if (!degisti) return;
    const yeni = { ...ay, metadatas };
    delete yeni.uid;
    delete yeni.isComponent;
    delete yeni.category;
    await servis.updateConfiguration(tip, yeni);
  };
  for (const tip of Object.values(app.contentTypes).filter((t) => t.uid.startsWith('api::'))) await isle(cm.service('content-types'), tip);
  for (const tip of Object.values(app.components)) await isle(cm.service('components'), tip);
  console.log(`duzeltilen aciklama: ${n}`);
  await app.destroy();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
