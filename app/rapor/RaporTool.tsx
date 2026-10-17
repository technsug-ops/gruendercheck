"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_NAME_TR, LOCALES, type Locale as Lang } from "@/lib/i18n";
import { inline, L, md, splitCover } from "@/lib/report/render";

// v1: legacy/rapor.html – görünüm ve davranış birebir. Markdown ve dil, panelin bıraktığı sessionStorage'dan
// (rapor_md, rapor_lang) gelir; düzenlemeler yine oraya yazılır. Hiçbir şey sunucuya gönderilmez.
type Kind = "report" | "plan";
const noop = () => () => {};
const read = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} };
const setTitle = (t: string) => { document.title = t; };

export default function RaporTool() {
  // Sunucuda (ve ilk çizimde) boş; tarayıcıda sessionStorage ve bugünün tarihi.
  const client = useSyncExternalStore(noop, () => true, () => false);
  const storedMd = useSyncExternalStore(noop, () => read("rapor_md"), () => null);
  const storedLang = useSyncExternalStore(noop, () => read("rapor_lang"), () => null);
  const [mdEdit, setMdEdit] = useState<string | null>(null);
  const [langEdit, setLangEdit] = useState<Lang | null>(null);
  const [kind, setKind] = useState<Kind>("report");
  const [who, setWho] = useState("");

  const src = mdEdit ?? storedMd ?? "";
  const lang: Lang = langEdit ?? (isLocale(storedLang) ? storedLang : DEFAULT_LOCALE);
  const T = L[lang];
  const today = client ? new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "de-DE") : "";
  const name = who.trim();
  const meta = (name ? `${T.forName.replace("{name}", name)} · ` : "") + `${T.date} ${today}`;
  // İlk "# başlık" ve hemen altındaki düz paragraf kapağa taşınır.
  const c = splitCover(src);
  const title = c.title || T[kind];

  useEffect(() => setTitle(title.slice(0, 80)), [title]);

  return (
    <>
      <div className="tools">
        <h1>Rapor PDF</h1>
        <p>Claude&apos;un yazdığı raporu (Markdown) yapıştır, önizlemeyi kontrol et, &quot;PDF olarak kaydet&quot; de. Hiçbir şey sunucuya gönderilmez.</p>
        <details><summary>Görsel bloklar</summary>
          <p><code>{"{{skor 76 | yeşil | Tek cümle karar}}"}</code> karar kartı · <code>{"{{kpi 7.900 € | Aylık hedef ciro}}"}</code> ardışık satırlar kutu sırası olur · <code>{"{{bar Etiket | 12-20 | gün | vurgu}}"}</code> ardışık satırlar aralık grafiği olur (önüne <code>{"{{grafik Başlık}}"}</code> yazılabilir) · &quot;Puan&quot; sütunu 1–5 ise nokta gösterge · &quot;Toplam&quot; veya &quot;Açık&quot; ile başlayan tablo satırı vurgulanır · ⚠️ ve &quot;(varsayım)&quot; otomatik etiket olur.</p>
        </details>
        <div className="row">
          <select id="lang" value={lang} onChange={(e) => { const v = e.target.value as Lang; setLangEdit(v); write("rapor_lang", v); }}>
            {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAME_TR[l]} başlık</option>)}
          </select>
          <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            <option value="report">Rapor</option><option value="plan">İş planı</option>
          </select>
          <input id="who" placeholder="Kime (isteğe bağlı, ör. Elif)" maxLength={60} value={who} onChange={(e) => setWho(e.target.value)} />
          <button id="print" onClick={() => window.print()}>PDF olarak kaydet / yazdır</button>
        </div>
        <textarea id="md" placeholder={"# Rapor başlığı\n\nMarkdown metnini buraya yapıştır…"} value={src}
          onChange={(e) => { setMdEdit(e.target.value); write("rapor_md", e.target.value); }} />
      </div>
      <div className="page">
        <div className="cover">
          <div className="brand"><b id="brand">{T[kind]}</b><span id="meta">{meta}</span></div>
          <h1 id="title">{title}</h1>
          {/* inline/md önce kaçışlar (esc); ham HTML geçmez. */}
          <p className="subtitle" id="subtitle" dangerouslySetInnerHTML={{ __html: c.sub ? inline(c.sub, lang) : "" }} />
        </div>
        <div className="doc" id="doc" dangerouslySetInnerHTML={{ __html: md(c.body, lang) }} />
        <div className="foot"><span id="foot">{T.foot}</span><span id="footbrand">{T.brand}</span></div>
      </div>
    </>
  );
}
