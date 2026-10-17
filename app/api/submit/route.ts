// Başvuru formu (/de, /tr) → kayıt + onay e-postası. v1: legacy/api/submit.js (aynı alanlar, aynı hata kodları).
// Rapor ancak e-posta onaylanınca yazılır (api/confirm): gerçek kişi, gerçek adres, boşa API maliyeti yok.
import { createSubmission } from "@/lib/data/submissions";
import { toLocale } from "@/lib/i18n";
import { qualityIssues } from "@/lib/domain/quality";
import { json, readJson } from "@/lib/http";
import { SITE } from "@/lib/ids";
import { confirmApplicant } from "@/lib/mail";
import { allow, clientIp } from "@/lib/ratelimit";

export const maxDuration = 60;

const DAY = 24 * 3600 * 1000;
// Sadece bu alanlar saklanır; istekteki diğer her şey yok sayılır.
const FIELDS: Record<string, number> = {
  lang: 5, idea: 3000, current_solution: 2000, talked: 10, paid: 5, business_type: 30, customers: 10,
  city: 120, residence: 30, situation: 30, hours: 10, founders: 5, experience: 2000, capital: 10,
  price: 20, unit_cost: 20, fixed_costs: 20, rent: 20, investment: 20, price_is_net: 5, personal_need: 20,
  delivery_days: 10, worry: 2000, first_name: 80, email: 200, consent: 5, src: 30,
  rev_model: 15, price_unknown: 5, competitor_price: 20,
};
const REQUIRED = ["lang", "idea", "current_solution", "business_type", "city", "residence", "situation", "capital", "email"];
const REV_MODELS = ["one_time", "subscription", "project", "commission"];

export async function POST(request: Request) {
  const body = await readJson(request, 30000);
  if ("error" in body) return body.error;
  const data = body.data;

  // Honeypot: botlar gizli "website" alanını doldurur. Başarılı gibi yanıt ver, hiçbir şey saklama.
  if (data.website) return json({ ok: true });

  const record: Record<string, string | boolean> = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    const v = data[key];
    if (v === undefined || v === null || v === "") continue;
    record[key] = typeof v === "boolean" ? v : String(v).slice(0, max);
  }
  for (const key of REQUIRED) {
    if (!record[key]) return json({ ok: false, error: "missing", field: key }, 400);
  }
  if (record.consent !== true) return json({ ok: false, error: "consent" }, 400);
  const email = String(record.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "email" }, 400);
  const lang = toLocale(record.lang);
  if (record.src && !/^[a-z0-9_-]{1,30}$/.test(String(record.src))) delete record.src;
  if (record.rev_model && !REV_MODELS.includes(String(record.rev_model))) delete record.rev_model;

  const bad = qualityIssues(record);
  if (bad.length) return json({ ok: false, error: "quality", fields: bad }, 400);

  const ip = clientIp(request);
  if (!(await allow("e:" + email.toLowerCase(), 3, DAY)) || (ip && !(await allow("i:" + ip, 6, DAY)))) {
    return json({ ok: false, error: "rate" }, 429);
  }

  // İsim, e-posta, dil ve kanal ayrı sütunlarda; geri kalan form alanları answers'ta.
  const COLUMNS = ["lang", "email", "first_name", "consent", "src"];
  const answers = Object.fromEntries(Object.entries(record).filter(([k]) => !COLUMNS.includes(k)));
  const { first_name, src } = record;
  let created;
  try {
    created = await createSubmission({
      lang, email, firstName: first_name ? String(first_name) : undefined, src: src ? String(src) : undefined, answers,
    });
  } catch (err) {
    console.error("submission insert failed", err);
    return json({ ok: false, error: "storage" }, 500);
  }
  const url = `${SITE}/api/confirm?id=${created.id}&t=${created.token}`;
  const mail = await confirmApplicant({ lang, firstName: first_name ? String(first_name) : null, email }, url);
  if ("ok" in mail && !mail.ok) return json({ ok: false, error: "mail" }, 502);
  return json({ ok: true });
}
