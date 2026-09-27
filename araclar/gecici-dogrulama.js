require('dotenv').config();
const crypto = require('crypto');
const mysql = require('mysql2/promise');

(async () => {
  const email = process.argv[2];
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  const [[u]] = await db.query('SELECT id FROM admin_users WHERE email = ?', [email]);
  if (!u) throw new Error('kullanici yok');
  const id = crypto.randomBytes(24).toString('hex');
  const kod = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const h = crypto.createHmac('sha256', process.env.GUVENLIK_SECRET).update(`kod:${id}:${kod}`).digest('hex');
  await db.query(
    'INSERT INTO swb_dogrulama (id,user_id,kod_hash,device_id,beni_hatirla,ip,ua,deneme,gonderim,son_gonderim,bitis) VALUES (?,?,?,?,0,?,?,0,1,NOW(),DATE_ADD(NOW(),INTERVAL 10 MINUTE))',
    [id, u.id, h, crypto.randomUUID(), '127.0.0.1', 'arac']
  );
  console.log(id, kod);
  await db.end();
})();
