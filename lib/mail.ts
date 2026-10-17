// E-posta: ALL-INKL SMTP üzerinden. Ayarlar Vercel ortam değişkenlerinde (SMTP_*, MAIL_FROM, NOTIFY_TO, MAIL_DRY).
// Gönderim hatası kaydı asla bozmaz; sadece loglanır. v1: legacy/lib/mail.js. Başvurana giden metinler
// messages/<dil>/mail.json'da; yönetici bildirimleri (Halil'e) Türkçe ve kodda.
import nodemailer, { type Transporter } from "nodemailer";
import { createTranslator } from "next-intl";
import { toLocale } from "@/lib/i18n";
import { SITE } from "@/lib/ids";
import { MESSAGES } from "@/messages";
import { OPERATOR } from "@/lib/operator";

const ADMIN_URL = `${SITE}/admin`;
let transport: Transporter | undefined;
function tx(): Transporter | null {
  if (transport) return transport;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transport = process.env.MAIL_DRY === "1"
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST || "w022397f.kasserver.com", port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
      });
  return transport;
}
const FROM_ADDR = () => process.env.MAIL_FROM || "rapor@gruenderchek.de";
const short = (s: unknown, n = 80) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

export type MailResult = { ok: true; id: string } | { ok: false; error: string } | { skipped: true };
/** MAIL_DRY=1 iken "gönderilen" mesajlar (uçtan uca testler için). */
export const dryOutbox: { to: string; subject: string; text: string }[] = [];

async function send(msg: { from: string; to: string; replyTo?: string; subject: string; text: string }): Promise<MailResult> {
  const t = tx();
  if (!t) { console.warn("mail: SMTP not configured"); return { skipped: true }; }
  try {
    const info = await t.sendMail(msg);
    if (process.env.MAIL_DRY === "1") {
      const m = { to: msg.to, subject: msg.subject, text: msg.text };
      dryOutbox.push(m);
      // Uçtan uca tarayıcı testi (e2e/) sunucu dışından okur. Sadece deneme modunda ve açıkça istenirse.
      if (process.env.MAIL_OUTBOX) (await import("node:fs")).appendFileSync(process.env.MAIL_OUTBOX, JSON.stringify(m) + "\n");
    }
    return { ok: true, id: info.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("mail failed", error);
    return { ok: false, error };
  }
}

export type NotifyKind = "submit" | "plan" | "feedback" | "draft" | "draft_error" | "draft_insufficient";
const LABEL: Record<NotifyKind, string> = {
  submit: "Yeni başvuru", plan: "Plan formu geldi", feedback: "Geri bildirim geldi", draft: "Rapor taslağı hazır – onay bekliyor",
  draft_error: "Rapor taslağı oluşturulamadı", draft_insufficient: "Başvuru yetersiz – rapor yazılmadı",
};

/** Halil'e bildirim: kişisel veri minimum, ayrıntı yönetici sayfasında. */
export function notifyAdmin(
  kind: NotifyKind,
  rec: { lang?: string; src?: string | null; city?: unknown; feedback?: { useful: string; next: string; wtp: string } | null },
): Promise<MailResult> {
  const to = process.env.NOTIFY_TO;
  if (!to) return Promise.resolve({ skipped: true });
  const label = LABEL[kind];
  // Fikir metni ve kişisel veri e-postaya konmaz (Gmail'e aktarım olmasın); ayrıntı yönetici sayfasında.
  const lines = [`${label} (${(rec.lang || "de").toUpperCase()}${rec.src ? ", kanal: " + rec.src : ""}${rec.city ? ", " + short(rec.city, 40) : ""})`];
  if (kind === "feedback" && rec.feedback) lines.push(`Fayda: ${rec.feedback.useful}/5 · Sıradaki adım: ${rec.feedback.next} · Ödeme isteği: ${rec.feedback.wtp}`);
  lines.push("", `Yönetici sayfası: ${ADMIN_URL}`);
  return send({ from: `Gründungs-Check <${FROM_ADDR()}>`, to, subject: `${label} – Gründungs-Check`, text: lines.join("\n") });
}

type Applicant = { lang: string; firstName?: string | null; email: string };

/** Başvurana giden e-posta: metinler messages/<dil>/mail.json, başvurunun dilinde. */
function applicantMail(kind: "confirm" | "report", rec: Applicant, values: { url: string; feedbackUrl?: string }) {
  const locale = toLocale(rec.lang);
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "mail" });
  const first = short(rec.firstName, 40);
  const text = t(`${kind}.text`, {
    name: first ? " " + first : "", url: values.url, feedbackUrl: values.feedbackUrl ?? "",
    company: OPERATOR.company, street: OPERATOR.street, zipTown: OPERATOR.zipTown,
  });
  return send({ from: `${t(`${kind}.from`)} <${FROM_ADDR()}>`, to: rec.email, replyTo: FROM_ADDR(), subject: t(`${kind}.subject`), text });
}

/** Başvurana e-posta onay linki. */
export const confirmApplicant = (rec: Applicant, url: string) => applicantMail("confirm", rec, { url });

/** Onaylanan raporun linkini başvurana gönderir. */
export const sendReport = (rec: Applicant, url: string, feedbackUrl: string) => applicantMail("report", rec, { url, feedbackUrl });
