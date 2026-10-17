"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { qualityIssues } from "@/lib/domain/quality";
import { CK } from "./icons";

// Form (v1: legacy/app.html). Gönderim sözleşmesi v1 ile aynı: POST /api/submit, aynı alanlar, aynı hata işleme.
type Lang = "de" | "tr";
type Sec = "s1" | "s2" | "s3" | "s4";
const SECS: Sec[] = ["s1", "s2", "s3", "s4"];
const REQ: Record<Sec, string[]> = { s1: ["idea", "current_solution", "business_type", "city"], s2: ["residence", "situation"], s3: ["capital", "rev_model", "price"], s4: ["email", "consent"] };
const REQUIRED = ["idea", "current_solution", "business_type", "city", "residence", "situation", "capital", "rev_model", "email"];
// Seçenek kodları (veri, gönderilen değer) burada; etiketler messages/<dil>/check.json → opt.<alan>.<kod> ("_" = "Bitte wählen").
const OPTIONS = {
  talked: ["0", "1-5", "6-20", "20+"], paid: ["no", "yes"],
  business_type: ["location", "onsite_service", "online_service", "online_products", "production", "other"],
  customers: ["b2c", "b2b", "both"], residence: ["de_eu", "settlement", "student", "job_search", "blue_card", "family", "other", "abroad"],
  situation: ["employed_full", "employed_part", "alg1", "buergergeld", "student", "self_employed"], founders: ["1", "2", "3+"],
  capital: ["0-5k", "5-15k", "15-50k", "50k+"], rev_model: ["one_time", "subscription", "project", "commission"],
} as const;
const SELECTS = ["talked", "paid", "business_type", "customers", "residence", "situation", "founders", "capital", "rev_model"] as const;
type SelectName = (typeof SELECTS)[number];

const $ = (id: string) => document.getElementById(id) as HTMLInputElement | null;
const val = (id: string) => $(id)?.value ?? "";
const checked = (id: string) => $(id)?.checked ?? false;
const filled = (id: string) => (id === "consent" ? checked("consent") : id === "price" ? val("price").trim() !== "" || checked("price_unknown") : val(id).trim() !== "");

interface View { pct: number; ok: Record<Sec, boolean>; empty: Record<SelectName, boolean>; bt: string; cu: string; rm: string; priceUnknown: boolean }
const INITIAL: View = {
  pct: 0, ok: { s1: false, s2: false, s3: false, s4: false },
  empty: Object.fromEntries(SELECTS.map((s) => [s, true])) as Record<SelectName, boolean>,
  bt: "", cu: "", rm: "", priceUnknown: false,
};
function readView(): View {
  const all = Object.values(REQ).flat();
  return {
    pct: Math.round((all.filter(filled).length / all.length) * 100),
    ok: Object.fromEntries(SECS.map((s) => [s, REQ[s].every(filled)])) as Record<Sec, boolean>,
    empty: Object.fromEntries(SELECTS.map((s) => [s, !val(s)])) as Record<SelectName, boolean>,
    bt: val("business_type"), cu: val("customers"), rm: val("rev_model"), priceUnknown: checked("price_unknown"),
  };
}

export default function CheckForm({ lang, home }: { lang: Lang; home: string }) {
  const t = useTranslations("check");
  const form = useRef<HTMLFormElement>(null);
  const [v, setV] = useState<View>(INITIAL);
  const [current, setCurrent] = useState<Sec>("s1");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<{ text: string; shown: boolean }>({ text: "", shown: false });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const netHidden = !(v.cu === "b2b" || v.cu === "both");
  useEffect(() => {
    const f = form.current;
    if (!f) return;
    const update = () => {
      const nv = readView();
      // v1 toggle(): Netto-Feld ausgeblendet → Häkchen entfernen.
      if (!(nv.cu === "b2b" || nv.cu === "both")) { const n = $("price_is_net"); if (n) n.checked = false; }
      setV(nv);
    };
    f.addEventListener("input", update);
    f.addEventListener("change", update);
    const io = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setCurrent(vis[0].target.id as Sec);
    }, { rootMargin: "-35% 0px -60% 0px" });
    SECS.forEach((id) => { const el = $(id); if (el) io.observe(el); });
    return () => { f.removeEventListener("input", update); f.removeEventListener("change", update); io.disconnect(); };
  }, []);
  useEffect(() => () => document.body.classList.remove("sent"), []);

  const opts = t.raw("opt") as Record<SelectName, Record<string, string>>;
  const sel = (name: SelectName, required = false) => (
    <select id={name} name={name} required={required} className={v.empty[name] ? "empty" : undefined} aria-invalid={errs[name] ? "true" : undefined}>
      <option value="">{opts[name]._}</option>
      {OPTIONS[name].map((value) => <option key={value} value={value}>{opts[name][value]}</option>)}
    </select>
  );
  const inv = (id: string) => (errs[id] ? "true" : undefined) as "true" | undefined;
  const E = (id: string): ReactNode => (errs[id] ? <div className="error" data-err-for={id}>{errs[id]}</div> : null);
  const Q = (id: string, q: string, o: { req?: boolean; hint?: string; labelId?: string; text?: string } = {}) => (
    <label className="q" htmlFor={id}><span id={o.labelId}>{o.text ?? t(q)}</span>{o.req ? <span className="req">*</span> : null}{o.hint ? <span className="hint">{t(o.hint)}</span> : null}</label>
  );
  const money = (id: string, step: string, inputMode: "decimal" | "numeric") => (
    <div className="money"><input type="number" id={id} name={id} min="0" step={step} inputMode={inputMode} /></div>
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormErr((p) => ({ ...p, shown: false }));
    const next: Record<string, string> = {};
    let first: string | null = null;
    const show = (id: string, msg: string) => { next[id] = msg; first = first || id; };
    for (const id of REQUIRED) if (!val(id).trim()) show(id, t("err_required"));
    // Kalite kontrolü (v1 istemcisi): sadece doldurulmuş alanlarda; boşsa "Pflichtfeld" hatası kalır.
    const iv = val("idea").trim(), sv = val("current_solution").trim();
    const bad = qualityIssues({ idea: iv, current_solution: sv });
    if (iv && bad.includes("idea")) show("idea", t("err_idea"));
    if (sv && bad.includes("current_solution")) show("current_solution", t("err_sol"));
    if (!val("price").trim() && !checked("price_unknown")) show("price", t("err_price"));
    const em = val("email").trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) show("email", t("err_email"));
    if (!checked("consent")) show("consent", t("err_consent"));
    flushSync(() => setErrs(next));
    if (first) { $(first)?.focus(); return; }

    const fd = new FormData(form.current!);
    const data: Record<string, unknown> = { lang };
    for (const [k, x] of fd.entries()) data[k] = typeof x === "string" ? x.trim() : x;
    data.consent = true;
    data.price_is_net = checked("price_is_net");
    data.price_unknown = checked("price_unknown");
    if (!data.price_unknown) delete data.competitor_price;
    const k = new URLSearchParams(location.search).get("k");
    if (k && /^[a-z0-9_-]{1,30}$/i.test(k)) data.src = k.toLowerCase();

    setSending(true);
    try {
      const r = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string; fields?: string[] };
        if (j.error === "quality") {
          // v1: unbekanntes Feld → $(f) ist null → Fehler → allgemeine Fehlermeldung (err_send).
          const add: Record<string, string> = {};
          let unknown = false;
          for (const f of j.fields || []) {
            if (!$(f)) { unknown = true; break; }
            add[f] = f === "idea" ? t("err_idea") : t("err_sol");
          }
          flushSync(() => setErrs((p) => ({ ...p, ...add })));
          const el = unknown ? null : $((j.fields || ["idea"])[0]);
          if (!el) throw new Error("quality");
          el.focus();
          setSending(false);
          return;
        }
        if (j.error === "rate") { setFormErr({ text: t("err_rate"), shown: true }); setSending(false); return; }
        throw new Error(String(r.status));
      }
      document.body.classList.add("sent");
      flushSync(() => setSent(true));
      window.scrollTo({ top: 0 });
    } catch {
      setFormErr({ text: t("err_send"), shown: true });
      setSending(false);
    }
  }

  const i = +current.slice(1);
  return (
    <>
      <div className={sent ? "pagehead hidden" : "pagehead"}><div className="wrap">
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <div className="chips">
          <span className="chip"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6.2" /><path d="M8 4.6V8l2.2 1.4" strokeLinecap="round" /></svg><span>{t("chip1")}</span></span>
          <span className="chip"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 2.8h7l3 3v7.4H3z" /><path d="M5.5 8h5M5.5 10.5h5" strokeLinecap="round" /></svg><span>{t("chip2")}</span></span>
          <span className="chip"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 1.8l5 2v4c0 3-2.2 5.2-5 6.4C5.2 13 3 10.8 3 7.8v-4z" /></svg><span>{t("chip3")}</span></span>
          <span className="chip"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3.5 8.4l3 3 6-6.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{t("badge")}</span></span>
        </div>
      </div></div>

      <div className="mprog" id="mprog"><div className="wrap"><div className="row"><b id="mstep">{`${t("stepof", { n: i })}: ${t(`s${i}` as Sec)}`}</b><span id="mpct">{`${v.pct} %`}</span></div><div className="track"><div className="fill" id="mfill" style={{ width: `${v.pct}%` }} /></div></div></div>

      <main className="wrap layout">
        <aside className="side">
          <div className="prog"><div className="row"><span>{t("progress")}</span><span id="pct">{`${v.pct} %`}</span></div><div className="track"><div className="fill" id="fill" style={{ width: `${v.pct}%` }} /></div></div>
          <ol className="steps" id="steps">
            {SECS.map((s) => (
              <li key={s}><a href={`#${s}`} className={[v.ok[s] && "ok", s === current && "active"].filter(Boolean).join(" ") || undefined}><span className="n">{v.ok[s] ? CK : s.slice(1)}</span><span>{t(s)}</span></a></li>
            ))}
          </ol>
          <div className="box"><h3>{t("gets")}</h3><ul className="points" id="points">{(t.raw("points") as string[]).map((p) => <li key={p}>{p}</li>)}</ul></div>
          <div className="trust" id="trust">{(t.raw("trust") as string[]).map((x) => <div key={x}>{CK}<span>{x}</span></div>)}</div>
        </aside>

        <div className="content">
          <form id="f" ref={form} noValidate onSubmit={submit} className={sent ? "hidden" : undefined}>
            <div className="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>

            <section className="card" id="s1">
              <div className="card-head"><span className="n">1</span><div><h2>{t("s1")}</h2><p className="sub">{t("s1sub")}</p></div></div>
              <div className="card-body">
                <div className="field">
                  {Q("idea", "q1", { req: true, hint: "q1h" })}
                  <textarea id="idea" name="idea" required maxLength={3000} aria-invalid={inv("idea")} />
                  {E("idea")}
                </div>
                <div className="field">
                  {Q("current_solution", "q2", { req: true, hint: "q2h" })}
                  <textarea id="current_solution" name="current_solution" required maxLength={2000} aria-invalid={inv("current_solution")} />
                  {E("current_solution")}
                </div>
                <div className="field grid2">
                  <div>{Q("talked", "q3")}{sel("talked")}</div>
                  <div>{Q("paid", "q3b")}{sel("paid")}</div>
                </div>
                <div className="field grid2">
                  <div>{Q("business_type", "q4", { req: true })}{sel("business_type", true)}{E("business_type")}</div>
                  <div>{Q("customers", "q4b")}{sel("customers")}</div>
                </div>
                <div className="field">
                  {Q("city", "q5", { req: true })}
                  <input type="text" id="city" name="city" required maxLength={120} aria-invalid={inv("city")} />
                  {E("city")}
                </div>
              </div>
            </section>

            <section className="card" id="s2">
              <div className="card-head"><span className="n">2</span><div><h2>{t("s2")}</h2><p className="sub">{t("s2sub")}</p></div></div>
              <div className="card-body">
                <div className="field">{Q("residence", "q6", { req: true, hint: "q6h" })}{sel("residence", true)}{E("residence")}</div>
                <div className="field">{Q("situation", "q7", { req: true })}{sel("situation", true)}{E("situation")}</div>
                <div className="field grid2">
                  <div>{Q("hours", "q8")}<input type="number" id="hours" name="hours" min="0" max="100" inputMode="numeric" /></div>
                  <div>{Q("founders", "q9")}{sel("founders")}</div>
                </div>
                <div className="field">
                  {Q("experience", "q10", { hint: "q10h" })}
                  <textarea id="experience" name="experience" maxLength={2000} />
                </div>
              </div>
            </section>

            <section className="card" id="s3">
              <div className="card-head"><span className="n">3</span><div><h2>{t("s3")}</h2><p className="sub">{t("s3sub")}</p></div></div>
              <div className="card-body">
                <div className="field grid2">
                  <div>{Q("capital", "q11", { req: true })}{sel("capital", true)}{E("capital")}</div>
                  <div>{Q("rev_model", "q12m", { req: true })}{sel("rev_model", true)}{E("rev_model")}</div>
                </div>
                <div className="field">
                  {Q("price", "q12a", { req: true, hint: "q12ah", labelId: "pricelabel", text: t(v.rm === "subscription" ? "q12a_sub" : v.rm === "commission" ? "q12a_com" : "q12a") })}
                  <div className="money"><input type="number" id="price" name="price" min="0" step="0.01" inputMode="decimal" aria-invalid={inv("price")} /></div>
                  <label className="check" style={{ marginTop: 12 }}><input type="checkbox" id="price_unknown" name="price_unknown" /><span>{t("q12u")}</span></label>
                  <div className={v.priceUnknown ? "sub-field" : "hidden sub-field"} id="compwrap">
                    {Q("competitor_price", "q12cp")}
                    {money("competitor_price", "0.01", "decimal")}
                  </div>
                  {E("price")}
                </div>
                <div className="field grid2">
                  <div>{Q("unit_cost", "q12c", { hint: "q12ch" })}{money("unit_cost", "0.01", "decimal")}</div>
                  <div>{Q("fixed_costs", "q12b", { hint: "q12bh" })}{money("fixed_costs", "1", "numeric")}</div>
                </div>
                <div className={v.bt === "location" ? "field" : "field hidden"} id="rentwrap">
                  {Q("rent", "q12r", { hint: "q12rh" })}
                  {money("rent", "1", "numeric")}
                </div>
                <div className="field grid2">
                  <div>{Q("investment", "q12d", { hint: "q12dh" })}{money("investment", "1", "numeric")}</div>
                  <div>{Q("personal_need", "q15", { hint: "q15h" })}{money("personal_need", "1", "numeric")}</div>
                </div>
                <div className={netHidden ? "field hidden" : "field"} id="netwrap">
                  <label className="check"><input type="checkbox" id="price_is_net" name="price_is_net" /><span>{t("q12net")}</span></label>
                </div>
                <div className={v.bt === "online_products" || v.bt === "production" ? "field" : "field hidden"} id="deliverywrap">
                  {Q("delivery_days", "q16")}
                  <input type="number" id="delivery_days" name="delivery_days" min="0" step="1" inputMode="numeric" />
                </div>
              </div>
            </section>

            <section className="card" id="s4">
              <div className="card-head"><span className="n">4</span><div><h2>{t("s4")}</h2><p className="sub">{t("s4sub")}</p></div></div>
              <div className="card-body">
                <div className="field">
                  {Q("worry", "q13")}
                  <textarea id="worry" name="worry" maxLength={2000} />
                </div>
                <div className="field grid2">
                  <div>{Q("first_name", "qname")}<input type="text" id="first_name" name="first_name" maxLength={80} autoComplete="given-name" /></div>
                  <div>{Q("email", "q14", { req: true })}<input type="email" id="email" name="email" required maxLength={200} autoComplete="email" aria-invalid={inv("email")} />{E("email")}</div>
                </div>
                <div className="field">
                  <label className="check"><input type="checkbox" id="consent" name="consent" required aria-invalid={inv("consent")} /><span>{t("consent")}</span></label>
                  {E("consent")}
                </div>
                <div className="submitrow">
                  <button className="primary" type="submit" id="submit" disabled={sending}><span id="submittxt">{sending ? t("sending") : t("submit")}</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                  <p className="after">{t("after")}</p>
                  <p className={formErr.shown ? "formerror" : "formerror hidden"} id="formerror" role="alert">{formErr.text}</p>
                </div>
              </div>
            </section>
          </form>

          <div className={sent ? "done" : "done hidden"} id="done" role="status">
            <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" strokeLinejoin="round" /></svg></div>
            <h2>{t("doneh")}</h2>
            <p>{t("donep")}</p>
            <ol className="nextsteps" id="nextsteps">{(t.raw("next") as string[]).map((x) => <li key={x}>{x}</li>)}</ol>
            <a href={home} id="donehome">{t("back")}</a>
          </div>
        </div>
      </main>
    </>
  );
}
