"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { val } from "@/lib/domain/brief";
import { VAT_OPTIONS } from "@/lib/domain/calc";
import { planToCsv, planToText } from "@/lib/domain/plan";
import {
  calcText, fmtDate, fmtN, feedbackText, forClaude, forClaudePlan, isFollow, isPayer, langOf, PATHNAME, planRes, STATUS, str, vatOf,
  type Item,
} from "./panel";

// v1: legacy/admin.html – görünüm, metinler ve davranış birebir. Bilinçli farklar:
// giriş HttpOnly çerezle (şifre tarayıcıda saklanmaz, istekler Authorization başlığı göndermez),
// kayıt kimliği "id", hazır taslaktaki uyarı (draft.warning) bir satır olarak gösterilir.

type Toast = (msg: string) => void;
type Row = { key: string; n: number; v?: number | null };
interface Stats {
  error?: string; detail?: string; since: string; total: { n: number; v: number | null };
  daily?: Row[]; requestPath?: Row[]; referrerHostname?: Row[]; utmSource?: Row[]; country?: Row[]; deviceType?: Row[];
}

async function api(method: string, body?: unknown) {
  const r = await fetch("/api/submissions", { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) throw new Error("unauthorized");
  if (!r.ok) throw new Error("http " + r.status);
  return r.json();
}

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error === "no_key" ? "ANTHROPIC_API_KEY Vercel'de tanımlı değil" : j.error === "mail" ? "E-posta gönderilemedi: " + (j.detail || "") : (j.error || "http " + r.status));
  return j;
}

async function copy(text: string, msg: string, toast: Toast) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { prompt("Kopyala:", text); }
}

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface ItemProps {
  it: Item; vat: string; toast: Toast; load: () => void;
  setVat: (id: string, v: string) => void;
  /** v1 render(items): tüm liste yeniden kurulur (açık/kapalı bölümler ve düzenlemeler sıfırlanır). */
  rerender: (fn: (items: Item[]) => Item[]) => void;
  /** v1 it.draft.md = …: listeyi yeniden kurmadan kayıttaki metni günceller. */
  update: (id: string, fn: (it: Item) => Item) => void;
}

function ItemCard({ it, vat, toast, load, setVat, rerender, update }: ItemProps) {
  const mdRef = useRef<HTMLTextAreaElement>(null);
  const l = langOf(it);
  const d = it.draft;
  const date = new Date(it.submitted_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });

  const mkdraft = async () => {
    if (d && (d.md || d.insufficient) && !confirm("Mevcut taslak silinip yeniden yazılsın mı?")) return;
    try { await call("/api/draft", "POST", { id: it.id }); toast("Taslak yazılıyor (1–3 dk)"); load(); } catch (e) { toast(errMsg(e)); }
  };
  const forcedraft = async () => {
    try { await call("/api/draft", "POST", { id: it.id, force: true }); toast("Rapor yazılıyor (1–3 dk)"); load(); } catch (e) { toast(errMsg(e)); }
  };
  const preview = () => {
    try { sessionStorage.setItem("rapor_md", mdRef.current?.value ?? ""); sessionStorage.setItem("rapor_lang", l); } catch {}
    window.open("/rapor", "_blank");
  };
  const savedraft = async () => {
    const md = mdRef.current?.value ?? "";
    try { await call("/api/draft", "PUT", { id: it.id, md }); update(it.id, (x) => ({ ...x, draft: { ...x.draft, md } })); toast("Taslak kaydedildi"); } catch (e) { toast(errMsg(e)); }
  };
  const send = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm(`Rapor ${it.email} adresine gönderilsin mi?`)) return;
    const btn = ev.currentTarget;
    btn.disabled = true;
    try { const r = await call("/api/report", "POST", { id: it.id, md: mdRef.current?.value ?? "" }); toast(r.mail_skipped ? "Kaydedildi, e-posta ayarı yok" : "Rapor gönderildi"); load(); }
    catch (e) { toast(errMsg(e)); btn.disabled = false; }
  };
  const setStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    try { await api("PATCH", { id: it.id, status }); rerender((items) => items.map((x) => (x.id === it.id ? { ...x, status } : x))); toast("Durum kaydedildi"); }
    catch { toast("Kaydedilemedi"); }
  };
  const remove = async () => {
    if (!confirm("Bu başvuru kalıcı olarak silinsin mi?")) return;
    try { await api("DELETE", { id: it.id }); load(); toast("Silindi"); } catch { toast("Silinemedi"); }
  };

  let draft: ReactNode;
  if (!d) draft = <div className="draft"><b>Rapor taslağı:</b> <span className="muted">yok</span> <button data-a="mkdraft" onClick={mkdraft}>Taslak oluştur</button></div>;
  else if (d.pending) draft = <div className="draft"><b>Rapor taslağı yazılıyor…</b> <span className="muted">{`(başladı ${fmtDate(d.created_at)}; genelde 1–3 dakika, sayfa kendini yeniler)`}</span> <button data-a="mkdraft" onClick={mkdraft}>Yeniden başlat</button></div>;
  else if (d.insufficient) draft = <div className="draft"><div className="precheck"><b>Başvuru yetersiz – rapor yazılmadı.</b> Başvurana gönderilebilecek mesaj:<pre>{str(d.message)}</pre><button data-a="copymsg" onClick={() => copy(str(d.message), "Mesaj kopyalandı", toast)}>Mesajı kopyala</button> <button data-a="forcedraft" onClick={forcedraft}>Yine de rapor yaz</button></div></div>;
  else if (d.error) draft = <div className="draft"><b className="err">Taslak oluşturulamadı:</b>{` ${d.error} `}<button data-a="mkdraft" onClick={mkdraft}>Tekrar dene</button></div>;
  else draft = (
    <details className="draft" open={!it.report}>
      <summary><b>Rapor taslağı</b> <span className="muted">{`· ${str(d.model)}${d.seconds ? " · " + d.seconds + " sn" : ""} · ${fmtDate(d.edited_at || d.created_at)}${d.edited_at ? " (düzeltildi)" : ""}`}</span></summary>
      {d.warning ? <div><b className="err">Uyarı:</b>{` ${d.warning}`}</div> : null}
      {d.precheck ? <div className="precheck"><b>Göndermeden önce sorulabilir:</b><pre>{d.precheck}</pre><button data-a="copyq" onClick={() => copy(str(d.precheck), "Sorular kopyalandı", toast)}>Soruları kopyala</button></div> : null}
      <textarea data-a="md" spellCheck={false} defaultValue={str(d.md)} ref={mdRef} />
      <div className="actions">
        <button data-a="preview" onClick={preview}>Önizle / PDF</button>
        <button data-a="savedraft" onClick={savedraft}>Düzeltmeyi kaydet</button>
        <button className="primary" data-a="send" onClick={send}>{it.report ? "Tekrar gönder" : "Onayla ve gönder"}</button>
        <button data-a="mkdraft" onClick={mkdraft}>Yeniden oluştur</button>
      </div>
    </details>
  );

  return (
    <div className="item">
      <div className="head">
        <h2>{`${str(it.first_name || "(isimsiz)")} `}<span className="tag">{it.lang === "tr" ? "TR" : "DE"}</span>
          {it.src ? <span className="tag">{it.src}</span> : null}
          {it.feedback ? <span className="tag">{`Geri bildirim ${str(it.feedback.useful)}/5`}</span> : null}
          {it.plan ? <span className="tag">Plan verisi var</span> : null}
          {it.confirmed === false ? <span className="tag warn">E-posta onayı bekleniyor</span> : null}
          {it.report ? <span className="tag">{`Rapor gönderildi ${fmtDate(it.report.sent_at)}`}</span> : (d && d.md && !d.pending ? <span className="tag warn">Taslak onay bekliyor</span> : null)}
        </h2>
        <span className="muted">{`${date} · ${str(it.city || "")}`}</span>
      </div>
      <div className="muted">{`${str(it.email)} · ${str(val("business_type", it.business_type))} · ${str(val("residence", it.residence))}`}</div>
      <div className="idea">{str(it.idea)}</div>
      <div className="actions">
        <button className="primary" data-a="claude" onClick={() => copy(forClaude(it, vat), "Kopyalandı (isim ve e-posta hariç)", toast)}>Claude için kopyala</button>
        <button data-a="email" onClick={() => copy(it.email, "E-posta kopyalandı", toast)}>E-postayı kopyala</button>
        <button data-a="fblink" onClick={() => copy(`${location.origin}/${l}/feedback?id=${it.id}`, "Geri bildirim linki kopyalandı", toast)}>Geri bildirim linki</button>
        <button data-a="planlink" onClick={() => copy(`${location.origin}/${l}/plan?id=${it.id}`, "Plan formu linki kopyalandı", toast)}>Plan formu linki</button>
        {it.plan ? <>
          <button className="primary" data-a="planclaude" onClick={() => copy(forClaudePlan(it, vat), "Plan metni kopyalandı (isim ve e-posta hariç)", toast)}>Plan için Claude&apos;a kopyala</button>
          <button data-a="csv" onClick={() => download(`finanzplan_${String(it.id).slice(0, 8)}.csv`, planToCsv(planRes(it, vat)))}>Plan CSV</button>
        </> : null}
        <select data-a="vat" title="KDV varsayımı (hesap için)" defaultValue={vat} onChange={(e) => setVat(it.id, e.target.value)}>
          {Object.entries(VAT_OPTIONS).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}
        </select>
        <select data-a="status" defaultValue={it.status || "new"} onChange={setStatus}>
          {STATUS.map(([k, lab]) => <option key={k} value={k}>{lab}</option>)}
        </select>
        <button className="danger" data-a="delete" onClick={remove}>Sil</button>
      </div>
      {draft}
      {it.report ? <div className="muted" style={{ marginTop: 6 }}>Rapor linki: <a href={`/${l}/r?id=${it.id}`} target="_blank" rel="noopener">{`/${l}/r?id=${String(it.id).slice(0, 8)}…`}</a></div> : null}
      {it.feedback ? <details open><summary>{`Geri bildirim (${String(it.feedback.at).slice(0, 10)})`}</summary><pre>{feedbackText(it.feedback)}</pre></details> : null}
      <details open><summary>Hesaplar</summary><pre data-a="calc">{calcText(it, vat)}</pre></details>
      {it.plan ? <details><summary>{`Finans planı (${String(it.plan.submitted_at).slice(0, 10)})`}</summary><pre data-a="plantext">{planToText(planRes(it, vat))}</pre></details> : null}
      <details><summary>Tüm cevaplar</summary><pre>{forClaude(it, vat)}</pre></details>
    </div>
  );
}

function HBars({ rows, label = (k) => k }: { rows?: Row[]; label?: (k: string) => string }) {
  if (!rows || !rows.length) return <p className="muted" style={{ margin: 0 }}>Henüz veri yok.</p>;
  const max = Math.max(...rows.map((r) => r.n)) || 1;
  return <>{rows.map((r, i) => (
    <div className="hb" key={i}><span className="lab" title={str(r.key)}>{str(label(r.key))}</span><span className="tr"><i style={{ width: `${((r.n / max) * 100).toFixed(1)}%` }}></i></span><span className="n">{fmtN(r.n)}</span></div>
  ))}</>;
}

function DailyChart({ rows: input }: { rows?: Row[] }) {
  if (!input || !input.length) return <p className="muted" style={{ margin: 0 }}>Henüz veri yok. İlk ziyaretler birkaç dakika içinde görünür.</p>;
  const rows = [...input].sort((a, b) => String(a.key).localeCompare(String(b.key)));
  const max = Math.max(...rows.map((r) => r.n)) || 1, f = (k: string) => new Date(k).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  return <>
    <div className="daily">{rows.map((r, i) => <div key={i} style={{ height: `${Math.max((r.n / max) * 100, 2)}%` }} title={`${f(r.key)}: ${r.n}`}>{rows.length <= 31 ? <span>{r.n}</span> : null}</div>)}</div>
    <div className="daxis"><span>{f(rows[0].key)}</span><span>{f(rows[rows.length - 1].key)}</span></div>
  </>;
}

function Analytics({ d, items }: { d: Stats; items: Item[] }) {
  if (d.error === "no_token") {
    return <div className="note"><b>Bir adım kaldı:</b> İstatistikleri burada görmek için Vercel erişim anahtarı gerekiyor.<br />1) vercel.com → sağ üst profil → <b>Account Settings → Tokens</b> → <b>Create Token</b> (Scope: technsug-ops-projects, isim: <i>foundercheck-stats</i>).<br />2) Proje → <b>Settings → Environment Variables</b> → anahtar adı <code>VERCEL_API_TOKEN</code>, değer: oluşturduğun token, ortam: Production, <b>Sensitive</b> işaretli.<br />3) Bana „token ekledim“ yaz, yeniden yayına alayım.</div>;
  }
  if (d.error) return <div className="note">{`Vercel verisi alınamadı: ${str(d.detail || d.error)}`}</div>;
  const since = Date.parse(d.since);
  const inP = items.filter((i) => Date.parse(i.submitted_at) >= since);
  const subs = inP.length, conf = inP.filter((i) => i.confirmed !== false).length, rep = inP.filter((i) => i.report).length, fb = inP.filter((i) => i.feedback).length;
  const pv = (keys: string[]) => (d.requestPath || []).filter((r) => keys.includes(r.key)).reduce((a, r) => a + r.n, 0);
  const home = pv(["/", "/tr/start", "/de/start"]), form = pv(["/de", "/tr"]);
  const vis = d.total.v;
  const conv = vis ? ((subs / vis) * 100).toFixed(1).replace(".", ",") + " %" : "–";
  const bySrc = inP.reduce((a: Record<string, number>, i) => ((a[i.src || "(etiketsiz)"] = (a[i.src || "(etiketsiz)"] || 0) + 1), a), {});
  return <>
    <div className="kpis">
      <div className="kpi"><b>{fmtN(d.total.n)}</b><span>Sayfa görüntüleme</span></div>
      <div className="kpi"><b>{fmtN(vis)}</b><span>Tekil ziyaretçi</span></div>
      <div className="kpi"><b>{fmtN(subs)}</b><span>Başvuru</span></div>
      <div className="kpi"><b>{fmtN(conf)}</b><span>E-posta onaylı</span></div>
      <div className="kpi"><b>{fmtN(rep)}</b><span>Rapor gönderildi</span></div>
      <div className="kpi"><b>{conv}</b><span>Ziyaretçiden başvuruya</span></div>
    </div>
    <div className="panel"><h3>Günlük sayfa görüntüleme</h3><DailyChart rows={d.daily} /></div>
    <div className="panel funnel"><h3>Huni (seçili dönem)</h3><HBars rows={[
      { key: "Ana sayfa görüntüleme", n: home }, { key: "Form görüntüleme", n: form }, { key: "Başvuru gönderildi", n: subs },
      { key: "E-posta onaylandı", n: conf }, { key: "Rapor gönderildi", n: rep }, { key: "Geri bildirim", n: fb }]} /></div>
    <div className="grid2s">
      <div className="panel"><h3>Sayfalar</h3><HBars rows={d.requestPath} label={(k) => PATHNAME[k] || k} /></div>
      <div className="panel"><h3>Gelinen siteler</h3><HBars rows={d.referrerHostname} label={(k) => k || "(doğrudan)"} /></div>
      <div className="panel"><h3>Kampanya kaynağı (utm_source)</h3><HBars rows={d.utmSource} label={(k) => k || "(yok)"} /></div>
      <div className="panel"><h3>Ülkeler</h3><HBars rows={d.country} /></div>
      <div className="panel"><h3>Cihaz</h3><HBars rows={d.deviceType} label={(k) => ({ mobile: "Telefon", desktop: "Bilgisayar", tablet: "Tablet" } as Record<string, string>)[k] || k} /></div>
      <div className="panel"><h3>Başvuru kanalı (?k= etiketi)</h3><HBars rows={Object.entries(bySrc).map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n)} /></div>
    </div>
    <p className="muted" style={{ fontSize: 13 }}>Kaynak: Vercel Web Analytics (çerezsiz). Başvuru sayıları kendi kayıtlarımızdan.</p>
  </>;
}

export default function AdminPanel() {
  const [view, setView] = useState<"login" | "app">("login");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [gen, setGen] = useState(0);
  const [vatChoice, setVatChoice] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"subs" | "ana">("subs");
  const [days, setDays] = useState(30);
  const [ana, setAna] = useState<Stats | null>(null);
  const [anaState, setAnaState] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const pw = useRef<HTMLInputElement>(null);
  const poll = useRef<{ timer?: ReturnType<typeof setTimeout>; n: number; authed: boolean }>({ n: 0, authed: false });

  const toast: Toast = (msg) => { setToastMsg(msg); setToastOn(true); setTimeout(() => setToastOn(false), 1800); };
  const render = (next: Item[]) => { setItems(next); setGen((g) => g + 1); };

  async function load() {
    const p = poll.current;
    try {
      const { items: list } = (await api("GET")) as { items: Item[] };
      p.authed = true;
      setView("app");
      render(list);
      clearTimeout(p.timer);
      if (list.some((i) => i.draft && i.draft.pending) && p.n++ < 20) p.timer = setTimeout(load, 20000); else p.n = 0;
    } catch {
      setView("login");
      // v1: oturum varken liste alınamazsa giriş ekranı "Şifre yanlış." ile döner.
      if (p.authed) setLoginErr("Şifre yanlış.");
      p.authed = false;
    }
  }

  async function login() {
    const password = pw.current?.value ?? "";
    setLoginErr(null);
    if (!password) return;
    try {
      const r = await fetch("/api/admin/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      if (r.status === 429) { setLoginErr("Çok fazla deneme, biraz sonra tekrar dene."); return; }
      if (!r.ok) { setLoginErr("Şifre yanlış."); return; }
    } catch { setLoginErr("Şifre yanlış."); return; }
    load();
  }

  async function logout() {
    try { await fetch("/api/admin/session", { method: "DELETE" }); } catch {}
    location.reload();
  }

  async function loadAna(n: number) {
    setAnaState("Yükleniyor…");
    let data: Stats;
    try { const r = await fetch("/api/stats?days=" + n); data = await r.json(); }
    catch { data = { error: "network" } as Stats; }
    setAnaState(""); setAna(data);
  }

  // Açılışta: oturum çerezi geçerliyse listeyi yükle (v1: sessionStorage'da şifre varsa).
  useEffect(() => {
    let live = true;
    fetch("/api/admin/session").then((r) => r.json()).then((j) => { if (live && j.ok) load(); }).catch(() => {});
    const p = poll.current;
    return () => { live = false; clearTimeout(p.timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = items ?? [];
  const counts: Record<string, number> = Object.fromEntries(STATUS.map(([k]) => [k, 0]));
  list.forEach((i) => { counts[i.status || "new"] = (counts[i.status || "new"] || 0) + 1; });
  const nf = list.filter(isFollow).length, np = list.filter(isPayer).length, nr = list.filter((i) => i.status && i.status !== "new").length;
  const ch: Record<string, { n: number; fu: number; paid: number }> = {};
  for (const i of list) {
    const c = (ch[i.src || "(etiketsiz)"] ||= { n: 0, fu: 0, paid: 0 });
    c.n++; if (isFollow(i)) c.fu++; if (isPayer(i)) c.paid++;
  }
  const channels = Object.entries(ch).sort((a, b) => b[1].n - a[1].n)
    .map(([k, c]) => `${k} ${c.n} başvuru · ${c.fu} takip · ${c.paid} ödeme isteği`).join("  |  ");

  const setVat = (id: string, v: string) => setVatChoice((m) => ({ ...m, [id]: v }));
  const rerender = (fn: (items: Item[]) => Item[]) => render(fn(items ?? []));
  const update = (id: string, fn: (it: Item) => Item) => setItems((xs) => (xs ?? []).map((x) => (x.id === id ? fn(x) : x)));
  const pickTab = (t: "subs" | "ana") => { setTab(t); if (t === "ana") loadAna(days); };
  const pickDays = (n: number) => { setDays(n); loadAna(n); };

  return (
    <>
      <div className="wrap">
        <h1>Başvurular</h1>
        <div className="muted">Gründungs-Check / İş Fikri Kontrolü · test formu</div>

        <div className="login" id="login" hidden={view !== "login"}>
          <label htmlFor="pw"><b>Yönetici şifresi</b></label>
          <input type="password" id="pw" autoComplete="current-password" ref={pw} onKeyDown={(e) => { if (e.key === "Enter") login(); }} />
          <button className="primary" id="go" onClick={login}>Giriş</button>
          <p className="err" id="loginerr" hidden={!loginErr}>{loginErr ?? "Şifre yanlış."}</p>
        </div>

        <div id="app" hidden={view !== "app"}>
          <div className="bar">
            <button id="reload" onClick={load}>Yenile</button>
            <button id="logout" onClick={logout}>Çıkış</button>
            <a href="/rapor" target="_blank" rel="noopener">Rapor PDF sayfası</a>
            <span className="muted" id="count">{items ? `${items.length} başvuru` : ""}</span>
          </div>
          <div className="tabs">
            <button className={tab === "subs" ? "on" : undefined} data-tab="subs" onClick={() => pickTab("subs")}>Başvurular</button>
            <button className={tab === "ana" ? "on" : undefined} data-tab="ana" onClick={() => pickTab("ana")}>İstatistik</button>
          </div>
          <div id="tab-subs" hidden={tab !== "subs"}>
            <div className="stats" id="stats" style={{ marginTop: 16 }}>
              {items ? STATUS.map(([k, lab]) => <div className="stat" key={k}><b>{counts[k] || 0}</b>{lab}</div>) : null}
            </div>
            <div id="gate" style={{ margin: "-8px 0 8px" }}>
              {items ? <><b>Karar kapısı:</b>{` rapor gönderilen ${nr} · takip isteği `}<b>{nf}</b>{" / 5 · ödeme isteği (≥ 50 € veya ödedi) "}<b>{np}</b>{" / 2"}
                {nf >= 5 && np >= 2 ? <>{" — "}<b>kapı geçildi</b></> : null}</> : null}
            </div>
            <div className="muted" id="channels" style={{ margin: "0 0 18px" }}>
              {list.length ? <><b>Kanallar:</b>{" " + channels}</> : null}
            </div>
            <div id="list">
              {items && !items.length ? <p className="muted">Henüz başvuru yok.</p> : null}
              {list.map((it) => (
                <ItemCard key={`${gen}:${it.id}`} it={it} vat={vatOf(it, vatChoice)} toast={toast} load={load} setVat={setVat} rerender={rerender} update={update} />
              ))}
            </div>
          </div>
          <div id="tab-ana" hidden={tab !== "ana"}>
            <div className="bar" style={{ marginBottom: 0 }}>
              <div className="period" id="period">
                {[7, 30, 90].map((n) => <button key={n} data-d={n} className={days === n ? "on" : undefined} onClick={() => pickDays(n)}>{`${n} gün`}</button>)}
              </div>
              <span className="muted" id="anastate">{anaState}</span>
            </div>
            <div id="ana">{ana ? <Analytics d={ana} items={list} /> : null}</div>
          </div>
        </div>
      </div>
      <div className={toastOn ? "toast show" : "toast"} id="toast">{toastMsg}</div>
    </>
  );
}
