import type { Metadata, Viewport } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckForm from "./_check/CheckForm";
import { OPERATOR } from "./_check/operator";
import "./_check/check.css";

// Form (v1: app.html): /de, /tr. Dil adresten gelir.
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "check" });
  return { title: t("brand") };
}
export const viewport: Viewport = { themeColor: "#0f2d4a", colorScheme: "light" };

const DS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"] as const;

export default async function CheckPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === "tr" ? "tr" : "de";
  const t = await getTranslations("check");
  const home = lang === "tr" ? "/tr/start" : "/";
  const o = OPERATOR;
  return (
    <>
      <header className="top"><div className="wrap">
        <a className="logo" id="homelink" href={home}><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0f2d4a" /><path d="M9 16.5l4.5 4.5L23 11.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><span id="brandname">{t("brand")}</span></a>
        {/* Dil seçici sadece Türkçe sayfada (Almanca sayfada bilerek başka dile işaret yok). */}
        <nav className="menu"><a className="nl" href="#datenschutz" id="navds">{t("dsh")}</a><span className="lang" id="langswitch">{lang === "tr" ? (
          // Sayfalar arası düz <a> (v1 gibi tam sayfa yüklemesi; next/link kullanılmaz).
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/de">{t("langswitch")}</a>
        ) : null}</span></nav>
      </div></header>

      <CheckForm lang={lang} home={home} />

      <footer className="foot"><div className="wrap">
        <p className="disc">{t("disclaimer")}</p>
        <details id="datenschutz"><summary>{t("dsh")}</summary><div id="dsbody">
          {DS.map((k) => (
            <p key={k}>{t.rich(`ds.${k}`, { company: o.company, address: o.address, email: o.email, b: (c) => <b>{c}</b>, i: (c) => <i>{c}</i> })}</p>
          ))}
        </div></details>
        <details id="impressum"><summary>{t("imp.title")}</summary><div id="impbody">
          <p>{t("imp.head")}</p>
          <p>{o.company}<br />{o.address}<br />{o.ceo}<br />{o.register}<br />{o.vat}<br />{t("imp.phone")} {o.phone}<br />{t("imp.email")} <a href={`mailto:${o.email}`}>{o.email}</a></p>
        </div></details>
        <div className="copy">{t("copy")}</div>
      </div></footer>
    </>
  );
}
