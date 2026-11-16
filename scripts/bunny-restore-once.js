'use strict';
// Restores bundled starter content into the EXISTING MariaDB database.
// Each completed stage is recorded in MariaDB so restarting cannot re-import it.
const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');

const stages = [
  ['products-v1', ['araclar/aktar.js', 'araclar/aktarim-urunler.json']],
  ['blog-categories-v1', ['araclar/aktar-blog.js']],
  ['site-text-v1', ['araclar/aktar-faz8.js', 'araclar/aktarim-faz8-yapisal.json', 'araclar/sozluk']],
  ['ai-settings-v1', ['araclar/aktar-faz10.js', 'araclar/aktarim-faz10-ai.json']],
];
const log = (...args) => console.log('[bunny-restore]', ...args);
async function main() {
  const db = await mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS swb_restore_history (
      stage VARCHAR(100) NOT NULL PRIMARY KEY,
      completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    const [locks] = await db.query('SELECT GET_LOCK(?, 5) AS locked', ['swb_restore_content_v1']);
    if (locks[0].locked !== 1) throw new Error('Restore lock unavailable');
    try {
      for (const [name, args] of stages) {
        const [rows] = await db.query('SELECT stage FROM swb_restore_history WHERE stage=?', [name]);
        if (rows.length) { log('SKIP (already imported):', name); continue; }
        log('START:', name);
        const r = spawnSync(process.execPath, args, {
          cwd: '/app',
          env: process.env,
          stdio: 'inherit',
          timeout: 15 * 60 * 1000,
        });
        if (r.error || r.status !== 0) {
          throw new Error(`Stage ${name} failed: ${r.error?.message || 'exit '+r.status}`);
        }
        await db.query('INSERT INTO swb_restore_history (stage) VALUES (?)', [name]);
        log('DONE:', name);
      }
    } finally {
      await db.query('SELECT RELEASE_LOCK(?)', ['swb_restore_content_v1']);
    }
  } finally { await db.end(); }
  log('All selected starter-content stages finished.');
}
main().catch((e) => { console.error('[bunny-restore] ERROR:', e.message); process.exitCode=1; });
