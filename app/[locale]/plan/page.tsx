import type { Metadata } from "next";
import { INTL_LOCALE, toLocale } from "@/lib/i18n";
import { OPERATOR } from "@/lib/operator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPlanForm } from "@/lib/data/plans";
import { condFlags, initialValues } from "./fields";
import PlanForm from "./PlanForm";
import "./plan.css";

// İş planı ek formu: /de/plan?id=… (v1 adresi). Dil, v1'deki gibi adresten gelir (kayıttan değil).
type Props = PageProps<"/[locale]/plan">;


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "plan" });
  return { title: t("kicker") };
}

export default async function PlanPage({ params, searchParams }: Props) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("plan");
  const tl = await getTranslations("common.legal");
  const q = (await searchParams).id;
  const id = typeof q === "string" ? q : "";
  const data = await getPlanForm(id);

  let form = null;
  if (data) {
    const pre = data.prefill;
    const costSub = pre.fixed_costs ? `${t("costsub")} ${t("costhint", { x: Number(pre.fixed_costs).toLocaleString(INTL_LOCALE[locale]) })}` : t("costsub");
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
          <summary>{tl("privacy")}</summary>
          <div id="dsbody">
            <p>{t.rich("ds1", { ...OPERATOR, b: (c) => <b>{c}</b> })}</p>
            <p>{t("ds2")}</p>
          </div>
        </details>
        <details>
          <summary>{tl("imprint")}</summary>
          <div id="impbody">
            <p>{tl("imprintHead")}</p>
            <p>{t.rich("imp2", { ...OPERATOR, ceo: `${tl("ceo")}: ${OPERATOR.ceoName}`, vat: `${tl("vat")} ${OPERATOR.vatId}`, phoneLabel: tl("phone"), emailLabel: tl("email"), br: () => <br />, mail: (c) => <a href={`mailto:${OPERATOR.email}`}>{c}</a> })}</p>
          </div>
        </details>
      </footer>
    </div>
  );
}
