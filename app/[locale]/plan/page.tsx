import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPlanForm } from "@/lib/data/plans";
import { condFlags, initialValues } from "./fields";
import PlanForm from "./PlanForm";
import "./plan.css";

// İş planı ek formu: /de/plan?id=… (v1 adresi). Dil, v1'deki gibi adresten gelir (kayıttan değil).
type Props = PageProps<"/[locale]/plan">;

// v1: legacy/plan.html OPERATOR (Datenschutz ve Impressum).
const OPERATOR = {
  company: "TechNS UG (haftungsbeschränkt)",
  address: "Ludwig-Erhard-Str. 16A, 61440 Oberursel (Taunus), Deutschland",
  register: "Amtsgericht Bad Homburg, HRB 16236",
  vat: "USt-IdNr. DE312006599",
  ceo: "Geschäftsführer: Halil Yaprakli",
  phone: "+49 6171 277 51 37",
  email: "info@dgitmarkt.de",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan" });
  return { title: t("kicker") };
}

export default async function PlanPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("plan");
  const q = (await searchParams).id;
  const id = typeof q === "string" ? q : "";
  const data = await getPlanForm(id);

  let form = null;
  if (data) {
    const pre = data.prefill;
    const costSub = pre.fixed_costs ? `${t("costsub")} ${t("costhint", { x: Number(pre.fixed_costs).toLocaleString("de-DE") })}` : t("costsub");
    form = <PlanForm id={id} flags={condFlags(pre)} values={initialValues(pre, data.plan)} costSub={costSub} />;
  }

  return (
    <div className="wrap">
      <header>
        <div className="kicker">{t("kicker")}</div>
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
      </header>

      {form ?? <div className="notice" id="invalid" role="alert"><h2>{t("invh")}</h2><p>{t("invp")}</p></div>}

      <footer>
        <p>{t("disclaimer")}</p>
        <details>
          <summary>{t("dsh")}</summary>
          <div id="dsbody">
            <p>{t.rich("ds1", { ...OPERATOR, b: (c) => <b>{c}</b> })}</p>
            <p>{t("ds2")}</p>
          </div>
        </details>
        <details>
          <summary>{t("imp")}</summary>
          <div id="impbody">
            <p>{t("imp1")}</p>
            <p>{t.rich("imp2", { ...OPERATOR, br: () => <br />, mail: (c) => <a href={`mailto:${OPERATOR.email}`}>{c}</a> })}</p>
          </div>
        </details>
      </footer>
    </div>
  );
}
