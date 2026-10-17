import type { Metadata } from "next";
import { INTL_LOCALE, toLocale } from "@/lib/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { getReport } from "@/lib/data/reports";
import { inline, L, md, splitCover } from "@/lib/report/render";
import "./report.css";

// Başvuranın raporu: /de/r?id=… (v1 adresi). Dil, raporun kendi dilidir.
type Props = PageProps<"/[locale]/r">;
const idOf = async (searchParams: Props["searchParams"]) => {
  const id = (await searchParams).id;
  return typeof id === "string" ? id : "";
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const rep = await getReport(await idOf(searchParams));
  if (!rep) return { title: "Bericht" };
  return { title: (splitCover(rep.md).title || L[rep.lang].report).slice(0, 80) };
}

export default async function ReportPage({ params, searchParams }: Props) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const id = await idOf(searchParams);
  const rep = await getReport(id);
  if (!rep) {
    const t = await getTranslations("report");
    return <div className="state">{t("missing")}</div>;
  }
  if (rep.lang !== locale) redirect(`/${rep.lang}/r?id=${id}`);

  const t = await getTranslations("report");
  const T = L[rep.lang];
  const c = splitCover(rep.md);
  const date = rep.sentAt.toLocaleDateString(INTL_LOCALE[rep.lang], { timeZone: "Europe/Berlin" });
  return (
    <>
      <div className="actions"><span className="hint">{t("hint")}</span><PrintButton label={t("pdf")} /></div>
      <div className="page">
        <div className="cover">
          <div className="brand"><b>{T.report}</b><span>{`${T.date} ${date}`}</span></div>
          <h1>{c.title || T.report}</h1>
          {/* inline/md önce kaçışlar (esc); ham HTML geçmez. */}
          <p className="subtitle" dangerouslySetInnerHTML={{ __html: c.sub ? inline(c.sub, rep.lang) : "" }} />
        </div>
        <div className="doc" dangerouslySetInnerHTML={{ __html: md(c.body, rep.lang) }} />
        <div className="foot"><span>{T.foot}</span><span>{T.brand}</span></div>
      </div>
      <div className="cta">
        <div>{t.rich("cta", { link: (chunks) => <a href={`/${rep.lang}/feedback?id=${id}`}>{chunks}</a> })}</div>
      </div>
    </>
  );
}
