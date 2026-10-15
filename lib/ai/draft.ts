// Otomatik rapor taslağı: başvuru metni + kodla hesaplanan sayılar → Claude API.
// Model isim ve e-posta görmez (briefText). Taslak, yönetici onaylayana kadar başvurana gitmez (AUTO_SEND=1 hariç).
// v1: legacy/lib/draft.js. Kayıt ve akış (DB, bildirim, AUTO_SEND) adım 5'te bunun üstüne kurulur.
import Anthropic from "@anthropic-ai/sdk";
import type { Answers } from "@/lib/domain/calc";
import { briefText } from "@/lib/domain/brief";
import { KB_VERSION, KURAL_TABANI, RAPOR_TALIMATI } from "./kb";

export const model = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
export { KB_VERSION };

const OUTPUT_RULES = `ÇIKTI KURALLARI (otomatik akış)
- Sadece rapor Markdown'ını yaz. Önüne veya arkasına açıklama, selamlama, kod bloğu koyma.
- Ön kontrol bloğu gerekiyorsa en başa tek başına "===HALİL===" satırı, altına soruları, sonra tek başına "===RAPOR===" satırı koy. Gerekmiyorsa bu satırları hiç yazma.
- Rapor "# " ile başlayan başlıkla başlasın; talimattaki "Görsel bloklar" kurallarına uy.
- Rapor doğrudan başvurana gidiyor: ona "sen" (Almanca "du") diye hitap et.
- Raporda iç kaynaklara atıf yapma: "kural tabanı", "bölüm 4", "karar kuralı 2", "HESAPLAR", "talimat" veya "Halil" kelimelerini rapora yazma. Bir konu kural tabanında yoksa "bunu [ilgili makam] ile netleştir" yaz.
- Kaynaklar bölümünde resmi kaynakları adlarıyla yaz (IHK, Handwerkskammer, Arbeitsagentur, kanun maddesi), "Almanya kural tabanı" yazma.
- Cevaplar değerlendirme yapılamayacak kadar boş, anlamsız veya şaka ise (rastgele harfler, tek kelime, konu dışı) rapor YAZMA. O zaman çıktının ilk satırına tek başına "===YETERSİZ===" yaz, altına başvurana gidecek, onun dilinde 2–4 cümlelik nazik bir mesaj yaz: hangi bilgilerin eksik olduğunu ve formu yeniden doldurmasını söyle. Başka hiçbir şey yazma.
- Bugünün tarihi: {TODAY}.`;

/** Modele giden kullanıcı metni. force: "Yine de rapor yaz" (YETERSİZ seçeneği kaldırılır). */
export function userText(answers: Answers, submittedAt: string, opts: { force?: boolean; today?: string; vatKey?: string } = {}): string {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  let rules = OUTPUT_RULES.replace("{TODAY}", today);
  if (opts.force) rules = rules.split("\n").filter((l) => !l.includes("===YETERSİZ===")).join("\n");
  return briefText(answers, submittedAt, opts.vatKey) + "\n\n" + rules;
}

/** Model çıktısını ön kontrol soruları (Halil için) ve rapor Markdown'ı olarak ayırır. */
export function splitDraft(text: string): { precheck: string; md: string } {
  let t = String(text || "").replace(/^\s*```(?:markdown|md)?\s*\n/, "").replace(/\n```\s*$/, "").trim();
  let precheck = "";
  const a = t.indexOf("===HALİL==="), b = t.indexOf("===RAPOR===");
  if (b !== -1) {
    precheck = t.slice(a !== -1 && a < b ? a + "===HALİL===".length : 0, b).trim();
    t = t.slice(b + "===RAPOR===".length).trim();
  } else {
    const h = t.search(/^# /m);
    if (h > 0) { precheck = t.slice(0, h).replace("===HALİL===", "").trim(); t = t.slice(h).trim(); }
  }
  return { precheck, md: t };
}

/** "===YETERSİZ===" varsa başvurana gidecek mesaj, yoksa null. */
export function insufficientMessage(text: string): string | null {
  const i = text.indexOf("===YETERSİZ===");
  return i === -1 ? null : text.slice(i + "===YETERSİZ===".length).trim().slice(0, 2000);
}

export interface ClaudeResult {
  text: string;
  model: string;
  usage: Anthropic.Beta.BetaUsage;
  stopReason: Anthropic.Beta.BetaStopReason | null;
}

// Sunucu tarafı yedek modele geçiş ("default"): sadece destekleyen modellerde gönderilir.
const FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);
const MAX_CONTINUATIONS = 3; // web araması pause_turn ile durursa

export async function callClaude(text: string): Promise<ClaudeResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY tanımlı değil");
  const client = new Anthropic({ timeout: 270_000, maxRetries: 1 });
  const m = model();
  const fallback = FALLBACK_MODELS.has(m);
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: text }];
  const parts: string[] = [];
  let last: Anthropic.Beta.BetaMessage | undefined;
  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    const stream = client.beta.messages.stream({
      model: m,
      max_tokens: 12000,
      system: [
        { type: "text", text: RAPOR_TALIMATI },
        { type: "text", text: "ALMANYA-KURAL-TABANI (hukuki ve vergisel kurallar için tek kaynak)\n\n" + KURAL_TABANI, cache_control: { type: "ephemeral" } },
      ],
      messages,
      ...(process.env.ANTHROPIC_WEB_SEARCH === "1" ? { tools: [{ type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 5 }] } : {}),
      ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    last = await stream.finalMessage();
    if (last.stop_reason === "refusal") {
      throw new Error(`Model raporu reddetti (${last.stop_details?.category ?? "kategori yok"})`);
    }
    for (const block of last.content) if (block.type === "text") parts.push(block.text);
    if (last.stop_reason !== "pause_turn") break;
    // Sunucu araç döngüsü durakladı: aynı turu sürdür (ek "devam" mesajı eklenmez).
    messages.push({ role: "assistant", content: last.content });
  }
  return { text: parts.join(""), model: last!.model, usage: last!.usage, stopReason: last!.stop_reason };
}
