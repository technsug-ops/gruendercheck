// Otomatik rapor taslağı: başvuru metni + kodla hesaplanan sayılar → Claude API → drafts/<id>.json
// Model isim ve e-posta görmez. Taslak, yönetici onaylayana kadar başvurana gitmez (AUTO_SEND=1 hariç).
import { put } from '@vercel/blob';
import { briefText } from '../brief.js';
import { RAPOR_TALIMATI, KURAL_TABANI, KB_VERSION } from './kb.js';
import { notifyAdmin } from './mail.js';
import { publishReport } from './report.js';

const API = 'https://api.anthropic.com/v1/messages';
const model = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const OUTPUT_RULES = `ÇIKTI KURALLARI (otomatik akış)
- Sadece rapor Markdown'ını yaz. Önüne veya arkasına açıklama, selamlama, kod bloğu koyma.
- Ön kontrol bloğu gerekiyorsa en başa tek başına "===HALİL===" satırı, altına soruları, sonra tek başına "===RAPOR===" satırı koy. Gerekmiyorsa bu satırları hiç yazma.
- Rapor "# " ile başlayan başlıkla başlasın; talimattaki "Görsel bloklar" kurallarına uy.
- Rapor doğrudan başvurana gidiyor: ona "sen" (Almanca "du") diye hitap et.
- Raporda iç kaynaklara atıf yapma: "kural tabanı", "bölüm 4", "karar kuralı 2", "HESAPLAR", "talimat" veya "Halil" kelimelerini rapora yazma. Bir konu kural tabanında yoksa "bunu [ilgili makam] ile netleştir" yaz.
- Kaynaklar bölümünde resmi kaynakları adlarıyla yaz (IHK, Handwerkskammer, Arbeitsagentur, kanun maddesi), "Almanya kural tabanı" yazma.
- Cevaplar değerlendirme yapılamayacak kadar boş, anlamsız veya şaka ise (rastgele harfler, tek kelime, konu dışı) rapor YAZMA. O zaman çıktının ilk satırına tek başına "===YETERSİZ===" yaz, altına başvurana gidecek, onun dilinde 2–4 cümlelik nazik bir mesaj yaz: hangi bilgilerin eksik olduğunu ve formu yeniden doldurmasını söyle. Başka hiçbir şey yazma.
- Bugünün tarihi: {TODAY}.`;

export function splitDraft(text) {
  let t = String(text || '').replace(/^\s*```(?:markdown|md)?\s*\n/, '').replace(/\n```\s*$/, '').trim();
  let precheck = '';
  const a = t.indexOf('===HALİL==='), b = t.indexOf('===RAPOR===');
  if (b !== -1) {
    precheck = t.slice(a !== -1 && a < b ? a + '===HALİL==='.length : 0, b).trim();
    t = t.slice(b + '===RAPOR==='.length).trim();
  } else {
    const h = t.search(/^# /m);
    if (h > 0) { precheck = t.slice(0, h).replace('===HALİL===', '').trim(); t = t.slice(h).trim(); }
  }
  return { precheck, md: t };
}

export async function callClaude(userText) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY tanımlı değil');
  const body = {
    model: model(),
    max_tokens: 12000,
    system: [
      { type: 'text', text: RAPOR_TALIMATI },
      { type: 'text', text: 'ALMANYA-KURAL-TABANI (hukuki ve vergisel kurallar için tek kaynak)\n\n' + KURAL_TABANI, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userText }],
  };
  if (process.env.ANTHROPIC_WEB_SEARCH === '1') body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(270000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`API ${r.status}: ${(j.error && j.error.message) || 'bilinmeyen hata'}`);
  const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  return { text, model: j.model, usage: j.usage, stop_reason: j.stop_reason };
}

export async function saveDraft(id, draft) {
  await put(`drafts/${id}.json`, JSON.stringify(draft, null, 2), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
}

/** Taslağı üretir ve saklar. Hata da saklanır, yönetici sayfasında görünür. */
export async function generateDraft(rec, opts = {}) {
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: 'no_key' };
  const started = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  let rules = OUTPUT_RULES.replace('{TODAY}', today);
  if (opts.force) rules = rules.split('\n').filter((l) => !l.includes('===YETERSİZ===')).join('\n');
  const userText = briefText(rec) + '\n\n' + rules;
  let draft;
  try {
    const res = await callClaude(userText);
    const meta = { id: rec.id, created_at: new Date().toISOString(), model: res.model, kb: KB_VERSION, seconds: Math.round((Date.now() - started) / 1000), usage: res.usage };
    const ins = res.text.indexOf('===YETERSİZ===');
    if (ins !== -1) {
      const out = { ...meta, insufficient: true, message: res.text.slice(ins + '===YETERSİZ==='.length).trim().slice(0, 2000) };
      try { await saveDraft(rec.id, out); } catch (err) { console.error('draft put failed', err); }
      await notifyAdmin('draft_insufficient', rec);
      return out;
    }
    const { precheck, md } = splitDraft(res.text);
    if (!/^#\s/.test(md)) throw new Error('Model geçerli bir rapor döndürmedi');
    draft = { id: rec.id, created_at: new Date().toISOString(), model: res.model, kb: KB_VERSION, seconds: Math.round((Date.now() - started) / 1000),
      usage: res.usage, stop_reason: res.stop_reason, precheck, md };
  } catch (err) {
    draft = { id: rec.id, created_at: new Date().toISOString(), model: model(), error: String((err && err.message) || err).slice(0, 400) };
  }
  try { await saveDraft(rec.id, draft); } catch (err) { console.error('draft put failed', err); }
  await notifyAdmin(draft.error ? 'draft_error' : 'draft', rec);
  return draft;
}

/** Onaylı başvuru için arka plan işi: taslak yaz; AUTO_SEND=1 ise soru içermeyen taslağı gönder. */
export async function draftInBackground(rec, pathname) {
  try {
    const draft = await generateDraft(rec);
    if (process.env.AUTO_SEND === '1' && draft && draft.md && !draft.error && !draft.precheck && !draft.insufficient) {
      await publishReport(rec, pathname, draft.md);
    }
  } catch (err) { console.error('draft failed', err); }
}
