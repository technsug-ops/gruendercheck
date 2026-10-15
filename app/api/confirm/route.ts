// E-posta onayı (/api/confirm?id=…&t=… – e-postalardaki link, adres v1 ile aynı). v1: legacy/api/confirm.js
// GET sadece bir onay düğmesi gösterir (e-posta tarayıcıları linki önceden açsa bile onay olmaz);
// asıl onay POST ile, bir insan düğmeye basınca olur.
import { after } from "next/server";
import { draftInBackground } from "@/lib/ai/run";
import { findForConfirm, markConfirmed } from "@/lib/data/submissions";
import { notifyAdmin } from "@/lib/mail";

// Taslak yazımı yanıt gittikten sonra after() içinde sürer (1–3 dk).
export const maxDuration = 300;

const T = {
  de: { title: "E-Mail bestätigen", ask: "Bitte bestätige deine E-Mail-Adresse, damit wir deinen Bericht erstellen.", btn: "E-Mail bestätigen",
        ok: "Danke, deine E-Mail ist bestätigt.", okp: "Wir erstellen jetzt deinen Bericht. Du bekommst ihn in etwa 30 Minuten per E-Mail.",
        again: "Deine E-Mail ist bereits bestätigt.", againp: "Dein Bericht ist in Arbeit oder schon unterwegs. Schau auch im Spam-Ordner nach.",
        bad: "Dieser Link ist ungültig oder abgelaufen.", badp: "Bitte fülle den Fragebogen erneut aus.", back: "Zur Startseite", home: "/" },
  tr: { title: "E-postanı onayla", ask: "Raporunu hazırlayabilmemiz için lütfen e-posta adresini onayla.", btn: "E-postamı onayla",
        ok: "Teşekkürler, e-postan onaylandı.", okp: "Raporunu şimdi hazırlıyoruz. Yaklaşık 30 dakika içinde e-postayla gelecek.",
        again: "E-postan zaten onaylanmış.", againp: "Raporun hazırlanıyor ya da yolda. Spam klasörüne de bak.",
        bad: "Bu link geçersiz veya süresi dolmuş.", badp: "Lütfen formu yeniden doldur.", back: "Ana sayfa", home: "/tr/start" },
};
type Lang = keyof typeof T;

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

function page(lang: Lang, h: string, p: string, form = "") {
  const t = T[lang];
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(t.title)}</title>
<style>body{margin:0;background:#f3f6f9;color:#16202c;font:16px/1.6 "Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif}
.box{max-width:520px;margin:12vh auto;padding:32px 28px;background:#fff;border:1px solid #dfe4ea;border-radius:12px;text-align:center}
.k{font-size:15px;color:#0f2d4a;font-weight:700}
h1{font:700 26px/1.25 "Segoe UI",system-ui,Arial,sans-serif;color:#0f2d4a;letter-spacing:-.015em;margin:10px 0 10px}p{color:#56616f;margin:0 0 20px}
button,a.b{display:inline-block;border:0;border-radius:8px;background:#0f2d4a;color:#fff;font:inherit;font-weight:600;padding:13px 22px;cursor:pointer;text-decoration:none}
a.l{color:#1d5fa8;font-size:14px}</style></head><body><div class="box"><div class="k">${lang === "tr" ? "İş Fikri Kontrolü" : "Gründungs-Check"}</div>
<h1>${esc(h)}</h1><p>${esc(p)}</p>${form || `<a class="l" href="${t.home}">${esc(t.back)}</a>`}</div></body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
const langOf = (l: string): Lang => (l === "tr" ? "tr" : "de");
const bad = () => page("de", T.de.bad, T.de.badp);

export async function GET(request: Request) {
  const u = new URL(request.url), id = u.searchParams.get("id") || "", t = u.searchParams.get("t") || "";
  const sub = await findForConfirm(id, t);
  if (!sub) return bad();
  const lang = langOf(sub.lang), L = T[lang];
  if (sub.confirmed) return page(lang, L.again, L.againp);
  return page(lang, L.title, L.ask, `<form method="post" action="/api/confirm"><input type="hidden" name="id" value="${esc(id)}"><input type="hidden" name="t" value="${esc(t)}"><button type="submit">${esc(L.btn)}</button></form>`);
}

export async function POST(request: Request) {
  let id: string, t: string;
  try {
    const f = await request.formData();
    id = String(f.get("id") || ""); t = String(f.get("t") || "");
  } catch { return bad(); }
  const sub = await findForConfirm(id, t);
  if (!sub) return bad();
  const lang = langOf(sub.lang), L = T[lang];
  if (!(await markConfirmed(sub.id))) return page(lang, L.again, L.againp);
  await notifyAdmin("submit", { lang: sub.lang, src: sub.src, city: sub.answers.city });
  after(() => draftInBackground(sub.id));
  return page(lang, L.ok, L.okp);
}
