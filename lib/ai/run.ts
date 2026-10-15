// Taslak akışı: Claude'u çağır, sonucu kaydet, Halil'e bildir; AUTO_SEND=1 ise soru içermeyen taslağı gönder.
// v1: legacy/lib/draft.js generateDraft + draftInBackground.
import { saveDraft } from "@/lib/data/drafts";
import { answersOf, getSubmission, type Submission } from "@/lib/data/submissions";
import { notifyAdmin } from "@/lib/mail";
import { publishReport } from "@/lib/report/publish";
import { callClaude, insufficientMessage, KB_VERSION, model, splitDraft, userText } from "./draft";

export type DraftOutcome = "skipped" | "ready" | "insufficient" | "error";

/** Taslağı üretir ve saklar. Hata da saklanır, yönetici sayfasında görünür. */
export async function generateDraft(sub: Submission, opts: { force?: boolean } = {}): Promise<{ outcome: DraftOutcome; md?: string; precheck?: string; truncated?: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) return { outcome: "skipped" };
  const started = Date.now();
  const seconds = () => Math.round((Date.now() - started) / 1000);
  const notify = { lang: sub.lang, src: sub.src, city: sub.answers.city };
  // "pending": yönetici sayfası, uzun süre bekleyen taslağı "takıldı" diye gösterir (fonksiyon zaman aşımı).
  await saveDraft(sub.id, { state: "pending", model: model() });
  try {
    const res = await callClaude(userText(answersOf(sub), sub.createdAt.toISOString(), { force: opts.force }));
    const meta = { model: res.model, kb: KB_VERSION, seconds: seconds(), usage: res.usage, stopReason: res.stopReason };
    const message = insufficientMessage(res.text);
    if (message !== null) {
      await saveDraft(sub.id, { ...meta, state: "insufficient", message });
      await notifyAdmin("draft_insufficient", notify);
      return { outcome: "insufficient" };
    }
    const { precheck, md } = splitDraft(res.text);
    if (!/^#\s/.test(md)) throw new Error("Model geçerli bir rapor döndürmedi");
    // Sınıra takılan taslak yarım kalmıştır: yine kaydedilir ama yönetici görsün diye hata notu düşülür.
    const truncated = res.stopReason === "max_tokens";
    const error = truncated ? "Taslak uzunluk sınırına takıldı, sonu eksik olabilir" : null;
    await saveDraft(sub.id, { ...meta, state: "ready", precheck: precheck || null, md, error });
    await notifyAdmin("draft", notify);
    return { outcome: "ready", md, precheck, truncated };
  } catch (err) {
    const error = String((err instanceof Error && err.message) || err).slice(0, 400);
    await saveDraft(sub.id, { state: "error", model: model(), seconds: seconds(), error }).catch((e) => console.error("draft save failed", e));
    await notifyAdmin("draft_error", notify);
    return { outcome: "error" };
  }
}

/** Onaylı başvuru için arka plan işi (after() içinde). */
export async function draftInBackground(id: string, opts: { force?: boolean } = {}): Promise<void> {
  try {
    const sub = await getSubmission(id);
    if (!sub) return;
    const draft = await generateDraft(sub, opts);
    if (process.env.AUTO_SEND === "1" && draft.outcome === "ready" && draft.md && !draft.precheck && !draft.truncated) {
      const fresh = await getSubmission(id);
      if (fresh && !fresh.reportSentAt) await publishReport(fresh, draft.md);
    }
  } catch (err) {
    console.error("draft failed", err);
  }
}
