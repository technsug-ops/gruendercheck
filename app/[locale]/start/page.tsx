import type { Metadata, Viewport } from "next";
import { OPERATOR_SHORT_ADDRESS } from "@/lib/operator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { esc, md } from "@/lib/report/render";
import { CheckIcon, Icon, PlusIcon, type IconName } from "./icons";
import PhotoLoader from "./PhotoLoader";
import "./start.css";

/* eslint-disable @next/next/no-img-element -- v1 ile birebir: düz <img>, yüklenince .loaded (PhotoLoader). */

// Tanıtım sayfası (v1: legacy/landing.html). Adresler: / (= /de/start), /de/start, /tr/start.
type Props = PageProps<"/[locale]/start">;
type Item = { title: string; text: string };

const OP = OPERATOR_SHORT_ADDRESS;
const TRUST_ICONS: IconName[] = ["book", "calc", "person", "lock"];
const GET_ICONS: IconName[] = ["gauge", "shield", "scale", "grid", "chart", "flag"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "start" });
  return { title: t("title"), description: t("description") };
}
export const viewport: Viewport = { colorScheme: "light" };

/** v1: ?k=<kanal> form linklerine taşınır (küçük harf, sadece güvenli karakterler). */
async function channelQuery(searchParams: Props["searchParams"]) {
  const sp = await searchParams;
  const k = typeof sp.k === "string" ? sp.k : "";
  return { kq: k && /^[a-z0-9_-]{1,30}$/i.test(k) ? `?k=${encodeURIComponent(k.toLowerCase())}` : "", lang: sp.lang };
}

function Photo({ src, label, icon }: { src: string; label: string; icon: IconName }) {
  return <figure className="ph" style={{ margin: 0 }}><img src={src} alt={label} loading="lazy" /><Icon name={icon} cls="pi" /></figure>;
}

export default async function StartPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { kq, lang } = await channelQuery(searchParams);
  // v1: /?lang=tr Türkçe sayfayı gösterirdi.
  if (locale === "de" && lang === "tr") redirect(`/tr/start${kq}`);

  const t = await getTranslations("start");
  const r = <T,>(key: string) => t.raw(key) as T;
  const formUrl = `/${locale}${kq}`;
  const other = r<{ lang: string; label: string }>("other");
  const otherUrl = (other.lang === "tr" ? "/tr/start" : "/") + kq;
  const nav = r<{ href: string; label: string }[]>("nav");
  const sample = r<string>("sample");
  const sampleHtml = md(sample, locale);
  const previewHtml = md(sample.split("\n\n").slice(0, 2).join("\n\n"), locale);
  const aboutFacts = r<{ label: string; value: string }[]>("aboutFacts");

  return (
    <>
      <header className="top"><div className="wrap">
        <a className="logo" href="#top"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0f2d4a" /><path d="M9 16.5l4.5 4.5L23 11.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><span id="brandname">{t("brand")}</span></a>
        <nav className="menu" id="menu">
          {nav.map(({ href, label }) => <a key={href} className="nl" href={href}>{label}</a>)}
          {/* /pwa.js bu düğmeyi bağlar (id ve yapı v1 ile aynı kalmalı). */}
          <button className="inst" id="installbtn" type="button" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M12 7v7M9 11.5l3 3 3-3" /></svg><span></span></button>
          <a className="lang" href={otherUrl} hrefLang={other.lang}>{other.label}</a>
          <a className="btn" href={formUrl}>{t("navcta")}</a>
        </nav>
      </div></header>
      <main id="top">
        <section className="hero"><div className="wrap">
          <div>
            <h1>{t("h1")}</h1>
            <p className="lead">{t("lead")}</p>
            <div className="ctas"><a className="btn" href={formUrl}>{t("cta")}</a><a className="btn line" href="#beispiel">{t("cta2")}</a></div>
            <ul className="checks">{r<string[]>("facts").map((f) => <li key={f}><CheckIcon />{f}</li>)}</ul>
          </div>
          <div className="visual">
            <Photo src="/img/hero.jpg" label={t("phHero")} icon="store" />
            <div className="card-float doc" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<p class="ct">${esc(t("cardTitle"))}</p>${previewHtml}` }} />
          </div>
        </div></section>
        <section className="trust" aria-label={t("trustLabel")}><div className="wrap">
          {r<Item[]>("trust").map(({ title, text }, i) => <div className="t" key={title}><Icon name={TRUST_ICONS[i]} /><div><b>{title}</b><p>{text}</p></div></div>)}
        </div></section>
        <section><div className="wrap split">
          <div className="head" style={{ margin: 0 }}><h2>{t("painH")}</h2><p>{t("painP")}</p></div>
          <div className="qs">{r<Item[]>("pains").map(({ title, text }) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</div>
        </div></section>
        <section className="soft"><div className="wrap withph">
          <Photo src="/img/beratung.jpg" label={t("phDesk")} icon="docs" />
          <div>
            <div className="head"><h2>{t("getH")}</h2><p>{t("getP")}</p></div>
            <div className="gets">{r<Item[]>("gets").map(({ title, text }, i) => <div className="g" key={title}><span className="ib"><Icon name={GET_ICONS[i]} /></span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
          </div>
        </div></section>
        <section id="so-gehts"><div className="wrap">
          <div className="head"><h2>{t("howH")}</h2></div>
          <ol className="steps">{r<{ time: string; title: string; text: string }[]>("steps").map(({ time, title, text }) => <li key={title}><div className="t">{time}</div><h3>{title}</h3><p>{text}</p></li>)}</ol>
        </div></section>
        <section className="soft" id="beispiel"><div className="wrap sample">
          <div>
            <h2>{t("smpH")}</h2>
            <p className="lead" style={{ margin: "14px 0 0", fontSize: 18 }}>{t("smpP")}</p>
            <ul className="ticks">{r<string[]>("smpList").map((x) => <li key={x}><CheckIcon />{x}</li>)}</ul>
            <a className="btn" href={formUrl}>{t("cta")}</a>
          </div>
          {/* md() önce kaçışlar; ham HTML geçmez. */}
          <div className="sheet"><div className="cov"><small>{t("brand")}</small><b>{t("pvtitle")}</b></div><div className="doc" dangerouslySetInnerHTML={{ __html: sampleHtml }} /></div>
        </div></section>
        <section id="ueber-uns"><div className="wrap">
          <div className="head"><h2>{t("aboutH")}</h2></div>
          <div className="about">
            <div><figure className="portrait" style={{ margin: 0 }}><img src="/img/halil.jpg" alt="Halil Yaprakli" /><span className="ini">HY</span></figure>
              <div className="name">Halil Yaprakli</div><div className="role">{`${aboutFacts[3].label}, TechNS UG`}</div></div>
            <div className="txt">
              <p className="quote">{`${t("aboutBig")} ${t("aboutBadge")}`}</p>
              {/* Metin dosyasındaki sabit <i>/<b> işaretleri (kullanıcı girdisi değil). */}
              {r<string[]>("aboutP").map((p) => <p key={p} dangerouslySetInnerHTML={{ __html: p }} />)}
              <h3 style={{ margin: "26px 0 8px" }}>{t("howWeH")}</h3><p>{t("howWe")}</p>
              <div className="limits" dangerouslySetInnerHTML={{ __html: r<string>("limits") }} />
              <dl className="facts">{aboutFacts.map(({ label, value }) => [<dt key={`t${label}`}>{label}</dt>, <dd key={`d${label}`}>{value}</dd>])}</dl>
            </div>
          </div>
        </div></section>
        <section className="soft" id="faq"><div className="wrap faqgrid">
          <div className="head" style={{ margin: 0 }}><h2>{t("faqH")}</h2><p>{t("faqP")}</p></div>
          <div className="faq">{r<{ q: string; a: string }[]>("faq").map(({ q, a }, i) => <details key={q} open={i === 0}><summary>{q}<PlusIcon /></summary><p>{a}</p></details>)}</div>
        </div></section>
        <section className="final"><div className="wrap"><div><h2>{t("finH")}</h2><p>{t("finP")}</p></div><a className="btn" href={formUrl}>{t("cta")}</a></div></section>
      </main>
      <footer><div className="wrap" id="foot">
        <div className="cols">
          <div><div className="logo">{t("brand")}</div><p style={{ margin: 0 }}>{OP.company}<br />{OP.address}<br /><a href={`mailto:${OP.email}`}>{OP.email}</a></p></div>
          <div><b>{t("pages")}</b><ul>{nav.map(({ href, label }) => <li key={href}><a href={href}>{label}</a></li>)}<li><a href={otherUrl}>{other.label}</a></li></ul></div>
          <div><b>{t("legal")}</b><ul><li><details><summary>{t("imp")}</summary><p>{t("impTitle")}<br />{OP.company}<br />{OP.address}<br />{OP.ceo}<br />{OP.register}<br />{OP.vat}<br />{`${t("phone")}: ${OP.phone}`}<br />{`${t("email")}: `}<a href={`mailto:${OP.email}`}>{OP.email}</a></p></details></li><li><a href={`${formUrl}#datenschutz`}>{t("dsLink")}</a></li></ul></div>
        </div>
        <div className="base">{`© ${new Date().getFullYear()} ${OP.company}. ${t("dsLine")}`}</div>
      </div></footer>
      <PhotoLoader />
    </>
  );
}
