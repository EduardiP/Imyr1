// deepseek-klient.js — Mbeshtjellës i pastër per thirrjet DeepSeek API (chat/tekst).
// Perdoret per Chat AI-n sqarues te Creative (para gjenerimit real).
// Format i njejte si OpenAI (chat completions).
//
// Kerkon env var: DEEPSEEK_API_KEY

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1/chat/completions';
const MODELI = 'deepseek-chat';

// mesazhet: [{role:'user'|'assistant', content:'...'}]  — pa sistem-in, ai jepet vecmas
async function pyetDeepSeek(mesazhet, sistemPrompt) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY s'është konfiguruar te serveri.");

  const r = await fetch(DEEPSEEK_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: MODELI,
      max_tokens: 500,
      messages: [{ role: 'system', content: sistemPrompt }, ...mesazhet]
    })
  });
  const data = await r.json();
  if (!r.ok) {
    const msg = (data && data.error && data.error.message) || ('DeepSeek gabim (' + r.status + ')');
    throw new Error(msg);
  }
  const teksti = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!teksti) throw new Error("DeepSeek s'ktheu përgjigje.");
  return teksti.trim();
}

module.exports = { pyetDeepSeek };
