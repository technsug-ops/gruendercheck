"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

// v1: legacy/feedback.html – form, doğrulama ve gönderim birebir. POST sözleşmesi aynı: /api/feedback, { id, ...dolu alanlar }.
type Field = "useful" | "next" | "wtp";
const REQUIRED: Field[] = ["useful", "next", "wtp"];
const NEXT = ["plan", "talk", "none"] as const;
const WTP = ["0", "lt50", "50-150", "150-300", "300+"] as const;

export default function FeedbackForm({ id, valid }: { id: string; valid: boolean }) {
  const t = useTranslations("feedback");
  const [marked, setMarked] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const unmark = (k: Field) => () => setMarked((m) => m.filter((x) => x !== k));
  const legend = (k: Field) => ({ color: marked.includes(k) ? "var(--err)" : undefined });
  const radios = (name: string, opts: [string, string][]) =>
    opts.map(([v, l]) => <label className="opt" key={v}><input type="radio" name={name} value={v} /><span>{l}</span></label>);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget), data: Record<string, string> = { id };
    for (const [k, v] of fd.entries()) { const s = String(v).trim(); if (s) data[k] = s; }
    const missing = REQUIRED.filter((k) => !data[k]);
    setMarked(missing);
    if (missing.length) {
      setError(t("err"));
      document.getElementById(`fs_${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
    setSending(true);
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw 0;
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("err_send"));
      setSending(false);
    }
  }

  return (
    <>
      <div className={valid ? "notice hidden" : "notice"} id="invalid" role="alert"><h2>{t("invh")}</h2><p>{t("invp")}</p></div>
      <form id="f" className={valid && !done ? undefined : "hidden"} noValidate onSubmit={submit}>
        <div className="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <section className="card">
          <fieldset id="fs_useful" onChange={unmark("useful")}><legend style={legend("useful")}>{t("q_useful")}</legend><div className="opts row" id="o_useful">{radios("useful", ["1", "2", "3", "4", "5"].map((n) => [n, n]))}</div>
            <div className="scale"><span>{t("s_low")}</span><span>{t("s_high")}</span></div></fieldset>
          <div className="field"><label className="q" htmlFor="best">{t("q_best")}</label><textarea id="best" name="best" maxLength={1500}></textarea></div>
          <div className="field"><label className="q" htmlFor="missing">{t("q_missing")}</label><textarea id="missing" name="missing" maxLength={1500}></textarea></div>
          <fieldset id="fs_next" onChange={unmark("next")}><legend style={legend("next")}>{t("q_next")}</legend><div className="opts" id="o_next">{radios("next", NEXT.map((v) => [v, t(`next.${v}`)]))}</div></fieldset>
          <fieldset id="fs_wtp" onChange={unmark("wtp")}><legend style={legend("wtp")}>{t("q_wtp")}</legend><div className="opts" id="o_wtp">{radios("wtp", WTP.map((v) => [v, t(`wtp.${v}`)]))}</div></fieldset>
          <button className="primary" type="submit" id="submit" disabled={sending}>{sending ? t("sending") : t("submit")}</button>
          <p className={error ? "error" : "error hidden"} id="formerror" role="alert">{error}</p>
        </section>
      </form>
      <div className={done ? "notice" : "notice hidden"} id="done" role="status"><h2>{t("doneh")}</h2><p>{t("donep")}</p></div>
    </>
  );
}
