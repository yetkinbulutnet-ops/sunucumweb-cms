'use strict';

const TABAN = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
const anahtar = () => process.env.DEEPSEEK_API_KEY || '';

const hazirMi = () => anahtar().length > 10;

class DeepseekHatasi extends Error {
  constructor(mesaj, durum) {
    super(mesaj);
    this.durum = durum;
  }
}

const istek = async (yol, secenek = {}, sure = 60000) => {
  if (!hazirMi()) throw new DeepseekHatasi('DeepSeek API anahtarı tanımlı değil.', 0);
  const r = await fetch(`${TABAN}${yol}`, {
    ...secenek,
    headers: { Authorization: `Bearer ${anahtar()}`, 'Content-Type': 'application/json', ...(secenek.headers || {}) },
    signal: AbortSignal.timeout(sure),
  });
  const govde = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = govde?.error?.message || `HTTP ${r.status}`;
    const tr = r.status === 402 || /insufficient balance/i.test(m) ? 'DeepSeek bakiyesi yetersiz.' : r.status === 401 ? 'DeepSeek API anahtarı geçersiz.' : r.status === 429 ? 'DeepSeek istek sınırına takıldı.' : `DeepSeek hatası: ${m}`;
    throw new DeepseekHatasi(tr, r.status);
  }
  return govde;
};

const sohbet = async ({ model, sistem, mesaj, json = false, maxToken = 16000, sicaklik = 0.7 }) => {
  let son;
  for (let deneme = 0; deneme < 3; deneme += 1) {
    try {
      const g = await istek(
        '/chat/completions',
        {
          method: 'POST',
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: sistem },
              { role: 'user', content: mesaj },
            ],
            max_tokens: maxToken,
            temperature: sicaklik,
            ...(json ? { response_format: { type: 'json_object' } } : {}),
          }),
        },
        600000
      );
      const metin = g?.choices?.[0]?.message?.content || '';
      const kullanim = { girdi: g?.usage?.prompt_tokens || 0, cikti: g?.usage?.completion_tokens || 0 };
      if (!metin.trim()) throw new DeepseekHatasi('DeepSeek boş yanıt döndürdü.', 200);
      if (!json) return { metin, kullanim };
      try {
        return { veri: JSON.parse(metin.replace(/^```(?:json)?\s*|\s*```$/g, '')), kullanim };
      } catch {
        throw new DeepseekHatasi('DeepSeek geçerli JSON döndürmedi.', 200);
      }
    } catch (e) {
      son = e;
      const durum = e instanceof DeepseekHatasi ? e.durum : -1;
      if ([0, 401, 402, 400].includes(durum)) throw e;
      await new Promise((r) => setTimeout(r, 5000 * (deneme + 1)));
    }
  }
  throw son instanceof DeepseekHatasi ? son : new DeepseekHatasi(`DeepSeek'e ulaşılamadı (${son?.message || 'bilinmeyen'}).`, -1);
};

const bakiye = async () => {
  const g = await istek('/user/balance', { method: 'GET' }, 10000);
  const b = (g?.balance_infos || [])[0] || {};
  return { kullanilabilir: !!g?.is_available, toplam: Number(b.total_balance || 0), paraBirimi: b.currency || 'USD' };
};

module.exports = { sohbet, bakiye, hazirMi, DeepseekHatasi };
