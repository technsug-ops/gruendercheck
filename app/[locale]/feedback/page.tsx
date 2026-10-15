import type { Metadata } from "next";
import { OPERATOR } from "@/lib/operator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFeedbackState } from "@/lib/data/feedback";
import FeedbackForm from "./FeedbackForm";
import "./feedback.css";

// Geri bildirim: /de/feedback?id=… (v1 adresi, e-postalarda). Dil, v1'deki gibi adresten gelir (kayıttan değil).
type Props = PageProps<"/[locale]/feedback">;

const O = OPERATOR;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback" });
  return { title: t("kicker") };
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = (await searchParams).id;
  const id = typeof raw === "string" ? raw : "";
  // v1 `done` bilgisini alır ama kullanmaz: formu yine gösterir (POST üzerine yazar). Aynısı korunuyor.
  const state = await getFeedbackState(id);
  const t = await getTranslations("feedback");
  return (
    <div className="wrap">
      <div className="kicker">{t("kicker")}</div>
      <h1>{t("title")}</h1>
      <p className="lead">{t("lead")}</p>
      <FeedbackForm id={id} valid={state !== null} />
      <footer><details><summary>{t("imp_summary")}</summary><div id="imp">
        <p>{t("imp_lead")}</p>
        <p>{O.company}<br />{O.address}<br />{O.ceo}<br />{O.register}<br />{O.vat}<br />{`${t("imp_phone")} ${O.phone}`}<br />{`${t("imp_email")} `}<a href={`mailto:${O.email}`}>{O.email}</a></p>
      </div></details></footer>
    </div>
  );
}
