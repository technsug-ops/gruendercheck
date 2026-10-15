// Yönetici panelinin saf yardımcıları ve sabitleri. v1: legacy/admin.html <script> (birebir).
// Hesap, plan ve "Claude için" metni lib/domain/* içinde; burada sadece panele özgü olanlar.
import { Q, briefText, calcText as calcTextFor, val } from "@/lib/domain/brief";
import { type Answers, suggestVat } from "@/lib/domain/calc";
import { buildPlan, planToText, type PlanInput } from "@/lib/domain/plan";

export interface Draft {
  pending?: boolean; insufficient?: boolean; error?: string; warning?: string; message?: string;
  md?: string; precheck?: string; model?: string; seconds?: number; created_at?: string; edited_at?: string;
}
export interface Feedback { useful: string; next: string; wtp: string; best?: string; missing?: string; at: string }
/** GET /api/submissions kaydı (lib/data/admin.ts listForAdmin; v1 ile aynı biçim): düz alanlar + form cevapları. */
export interface Item {
  [answer: string]: unknown;
  id: string; pathname: string; lang: string; email: string; first_name?: string; src?: string;
  submitted_at: string; status?: string; confirmed?: boolean;
  draft?: Draft; report?: { sent_at: string }; feedback?: Feedback; plan?: PlanInput;
}

export const STATUS: [string, string][] = [["new", "Yeni"], ["report_sent", "Rapor gönderildi"], ["feedback", "Geri bildirim geldi"], ["follow_up", "Takip hizmeti istedi"], ["plan_link_sent", "Plan formu gönderildi"], ["plan_sent", "Plan gönderildi"], ["paid", "Ödedi"], ["closed", "Kapandı"]];
export const FB: { next: Record<string, string>; wtp: Record<string, string> } = {
  next: { plan: "İş planı istiyor", talk: "Görüşme istiyor", none: "Şimdilik bir şey istemiyor" },
  wtp: { "0": "Hiç (sadece ücretsiz)", "lt50": "50 €'dan az", "50-150": "50–150 €", "150-300": "150–300 €", "300+": "300 €'dan fazla" },
};
export const isFollow = (i: Item) => ["follow_up", "plan_link_sent", "plan_sent", "paid"].includes(i.status ?? "") || (!!i.feedback && i.feedback.next !== "none");
export const isPayer = (i: Item) => i.status === "paid" || (!!i.feedback && ["50-150", "150-300", "300+"].includes(i.feedback.wtp));
export const PQ: Record<string, string> = {
  start_month: "Planlanan başlangıç", t_offer: "Ürün/hizmet ayrıntısı", t_target: "Hedef müşteri", t_competitors: "Rakipler", t_usp: "Neden biz", t_location: "Konum",
  t_marketing: "Müşteri kazanımı", t_org: "Organizasyon, tedarikçiler, ortaklar", t_cv: "Kurucu özgeçmişi", t_risks: "Riskler ve önlemler", gz_apply: "Gründungszuschuss başvurusu",
};
export const PATHNAME: Record<string, string> = { "/": "Ana sayfa (DE)", "/tr/start": "Ana sayfa (TR)", "/de/start": "Ana sayfa (DE)", "/de": "Form (DE)", "/tr": "Form (TR)", "/de/r": "Rapor sayfası (DE)", "/tr/r": "Rapor sayfası (TR)", "/de/feedback": "Geri bildirim (DE)", "/tr/feedback": "Geri bildirim (TR)" };

/** v1 esc() gibi: null/undefined → "". (React metni kendisi kaçışlar.) */
export const str = (v: unknown) => String(v ?? "");
export const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "");
export const fmtN = (n: number | null | undefined) => (n == null ? "–" : Number(n).toLocaleString("tr-TR"));
export const langOf = (it: Item) => (it.lang === "tr" ? "tr" : "de");

// Hesaplar: kayıt, form cevaplarını düz alan olarak taşır.
const ans = (it: Item) => it as unknown as Answers;
export const vatOf = (it: Item, choice: Record<string, string>) => choice[it.id] || suggestVat(ans(it));
export const calcText = (it: Item, vat: string) => calcTextFor(ans(it), vat);
export const planRes = (it: Item, vat: string) => buildPlan(ans(it), it.plan ?? {}, vat);
/** "Claude için kopyala": isim ve e-posta hariç. */
export const forClaude = (it: Item, vat: string) => briefText(ans(it), it.submitted_at, vat);

export function forClaudePlan(it: Item, vat: string): string {
  const tr = it.lang === "tr";
  const lines = ["İş planı yaz (projedeki BUSINESSPLAN-TALIMATI belgesine göre). Plan dili: Almanca." + (tr ? " Kurucu Türkçe konuşuyor: sona 1 sayfalık Türkçe özet ekle." : ""), ""];
  lines.push("DENETİM FORMU CEVAPLARI");
  for (const [k, label] of Object.entries(Q)) { if (it[k] === undefined || it[k] === "") continue; lines.push(`${label}: ${val(k, it[k])}`); }
  lines.push("", "PLAN FORMU METİN CEVAPLARI");
  const plan = it.plan ?? {};
  for (const [k, label] of Object.entries(PQ)) { const v = plan[k]; if (v === undefined || v === "") continue; lines.push(`${label}: ${v}`); }
  lines.push("", planToText(planRes(it, vat)));
  return lines.join("\n");
}

export function feedbackText(f: Feedback): string {
  return `Fayda: ${str(f.useful)}/5\nSıradaki adım: ${str(FB.next[f.next] || f.next)}\nİş planına ödeme isteği: ${str(FB.wtp[f.wtp] || f.wtp)}` +
    (f.best ? "\nEn faydalı: " + f.best : "") + (f.missing ? "\nEksik/yanlış: " + f.missing : "");
}
