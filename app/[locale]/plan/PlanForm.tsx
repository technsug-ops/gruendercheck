"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { REQ, SECTIONS, type Cond, type Field } from "./fields";

interface Props {
  id: string;
  flags: Record<Cond, boolean>;
  values: Record<string, string>;
  /** "Laufende Kosten" alt başlığı (v1: costsub + costhint, sunucuda biçimlendirilir) */
  costSub: string;
}

// v1 (legacy/plan.html) formu: aynı DOM, aynı gönderim (POST /api/plan, JSON).
export default function PlanForm({ id, flags, values, costSub }: Props) {
  const t = useTranslations("plan");
  // Alan/bölüm anahtarları koddaki şemadan (fields.ts) üretilir; dillerin anahtar uyumunu messages/index.ts tipi denetler.
  const tk = (key: string) => t(key as Parameters<typeof t>[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  const err = (key: string) => errors[key] ? <div className="error" data-err-for={key}>{errors[key]}</div> : null;
  const lineh = [t("lineh.name"), t("lineh.price"), t("lineh.cost"), t("lineh.share")];

  function input(f: Field) {
    const { key } = f;
    const dv = values[key];
    switch (f.type) {
      case "num":
        return <input type="number" id={key} name={key} min="0" step="any" inputMode="decimal" defaultValue={dv} aria-invalid={errors[key] ? "true" : undefined} />;
      case "month":
        return <input type="month" id={key} name={key} placeholder="2027-03" defaultValue={dv} />;
      case "area":
        return <textarea id={key} name={key} maxLength={3000} defaultValue={dv} />;
      case "select":
        return (
          <select id={key} name={key} defaultValue={dv}>
            {f.options!.map((v) => <option key={v} value={v}>{tk(`fields.${key}.options.${v || "none"}`)}</option>)}
          </select>
        );
      case "lines":
        return (
          <div className="lines">
            <div className="lineh">{lineh.map((h) => <span key={h}>{h}</span>)}</div>
            {[1, 2, 3].map((i) => (
              <div className="line" key={i}>
                <input type="text" id={`p${i}_name`} name={`p${i}_name`} placeholder={lineh[0]} maxLength={80} aria-label={`${lineh[0]} ${i}`} defaultValue={values[`p${i}_name`]} />
                <input type="number" id={`p${i}_price`} name={`p${i}_price`} placeholder={lineh[1]} min="0" step="any" inputMode="decimal" aria-label={`${lineh[1]} ${i}`} defaultValue={values[`p${i}_price`]} />
                <input type="number" id={`p${i}_cost`} name={`p${i}_cost`} placeholder={lineh[2]} min="0" step="any" inputMode="decimal" aria-label={`${lineh[2]} ${i}`} defaultValue={values[`p${i}_cost`]} />
                <input type="number" id={`p${i}_share`} name={`p${i}_share`} placeholder={lineh[3]} min="0" max="100" step="any" inputMode="decimal" aria-label={`${lineh[3]} ${i}`} defaultValue={values[`p${i}_share`]} />
              </div>
            ))}
          </div>
        );
    }
  }

  function field(f: Field) {
    const { key } = f;
    return (
      <div key={key} className={f.cond && !flags[f.cond] ? "field hidden" : "field"} data-cond={f.cond} id={`w_${key}`}>
        <label className="q" htmlFor={key}>
          {tk(`fields.${key}.label`)}
          {f.req && <span className="req">*</span>}
          {f.hint && <span className="hint">{tk(`fields.${key}.hint`)}</span>}
        </label>
        {input(f)}
        {err(key)}
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setFormError("");
    const errs: Record<string, string> = {};
    let first: HTMLElement | null = null;
    for (const k of REQ) {
      const el = form.elements.namedItem(k) as HTMLInputElement;
      if (!el.value.trim()) { errs[k] = t("err_required"); first ??= el; }
    }
    const c = form.elements.namedItem("consent") as HTMLInputElement;
    if (!c.checked) { errs.consent = t("err_consent"); first ??= c; }
    setErrors(errs);
    if (first) { first.focus(); return; }
    const data: Record<string, unknown> = { id, consent: true };
    for (const [k, v] of new FormData(form).entries()) { if (k === "consent") continue; const s = typeof v === "string" ? v.trim() : v; if (s !== "") data[k] = s; }
    form.querySelectorAll<HTMLInputElement>("[data-cond].hidden input, [data-cond].hidden select, [data-cond].hidden textarea").forEach((el) => delete data[el.name]);
    setSending(true);
    try {
      const r = await fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(String(r.status));
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError(t("err_send"));
      setSending(false);
    }
  }

  return (
    <>
      <form id="f" noValidate className={done ? "hidden" : undefined} onSubmit={onSubmit}>
        <div className="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <div id="sections">
          {SECTIONS.map((s) => {
            const sub = s.subKey ? costSub : s.sub ? tk(`sections.${s.id}.sub`) : "";
            const body = s.f.map(field);
            return (
              <section className="card" id={`sec_${s.id}`} key={s.id}>
                <h2>{tk(`sections.${s.id}.h`)}</h2>
                {sub ? <p className="sub" id={`sub_${s.id}`}>{sub}</p> : null}
                {s.grid ? <div className="grid2">{body}</div> : body}
                {s.after ? <div style={{ marginTop: 18 }}>{s.after.map(field)}</div> : null}
              </section>
            );
          })}
        </div>
        <section className="card">
          <div className="field">
            <label className="check"><input type="checkbox" id="consent" name="consent" aria-invalid={errors.consent ? "true" : undefined} /><span>{t("consent")}</span></label>
            {err("consent")}
          </div>
          <button className="primary" type="submit" id="submit" disabled={sending}>{sending ? t("sending") : t("submit")}</button>
          <p className={formError ? "formerror" : "formerror hidden"} id="formerror" role="alert">{formError}</p>
        </section>
      </form>
      <div className={done ? "notice" : "notice hidden"} id="done" role="status"><h2>{t("doneh")}</h2><p>{t("donep")}</p></div>
    </>
  );
}
