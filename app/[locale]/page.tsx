import type { Metadata, Viewport } from "next";
import { DEFAULT_LOCALE, homePath, toLocale } from "@/lib/i18n";
import { MESSAGES } from "@/messages";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckForm from "./_check/CheckForm";
import { OPERATOR } from "@/lib/operator";
import "./_check/check.css";

// Form (v1: app.html): /de, /tr. Dil adresten gelir.
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "check" });
  return { title: t("brand") };
}
export const viewport: Viewport = { themeColor: "#0f2d4a", colorScheme: "light" };

const DS = ["p1", "p2", "p3", "p4", "quality", "p5", "p6", "p7", "p8"] as const;

export default async function CheckPage({ params }: PageProps<"/[locale]">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const lang = locale;
  const t = await getTranslations("check");
  const tl = await getTranslations("common.legal");
  const home = homePath(locale);
  const o = OPERATOR;
  return (
    <>
      <header className="top"><div className="wrap">
        <a className="logo" id="homelink" href={home}><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0f2d4a" /><path d="M9 16.5l4.5 4.5L23 11.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><span id="brandname">{t("brand")}</span></a>
        {/* Dil seçici sadece varsayılan dil dışındaki sayfalarda, varsayılan dile götürür (v1: TR → DE). */}
        <nav className="menu"><a className="nl" href="#datenschutz" id="navds">{tl("privacy")}</a><span className="lang" id="langswitch">{locale !== DEFAULT_LOCALE ? (
          // Sayfalar arası düz <a> (v1 gibi tam sayfa yüklemesi; next/link kullanılmaz).
          <a href={`/${DEFAULT_LOCALE}`}>{MESSAGES[DEFAULT_LOCALE].common.langName}</a>
        ) : null}</span></nav>
      </div></header>

      <CheckForm lang={lang} home={home} />

      <footer className="foot"><div className="wrap">
        <p className="disc">{t("disclaimer")}</p>
        <details id="datenschutz"><summary>{tl("privacy")}</summary><div id="dsbody">
          {DS.map((k) => (
            <p key={k}>{t.rich(`ds.${k}`, { company: o.company, address: o.address, email: o.email, b: (c) => <b>{c}</b>, i: (c) => <i>{c}</i> })}</p>
          ))}
        </div></details>
        <details id="impressum"><summary>{tl("imprint")}</summary><div id="impbody">
          <p>{tl("imprintHead")}</p>
          <p>{o.company}<br />{o.address}<br />{`${tl("ceo")}: ${o.ceoName}`}<br />{o.register}<br />{`${tl("vat")} ${o.vatId}`}<br />{tl("phone")}: {o.phone}<br />{tl("email")}: <a href={`mailto:${o.email}`}>{o.email}</a></p>
        </div></details>
        <div className="copy">{`© ${new Date().getFullYear()} ${o.company}`}</div>
      </div></footer>
    </>
  );
}
