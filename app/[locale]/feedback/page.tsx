import type { Metadata } from "next";
import { toLocale } from "@/lib/i18n";
import { OPERATOR } from "@/lib/operator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFeedbackState } from "@/lib/data/feedback";
import FeedbackForm from "./FeedbackForm";
import "./feedback.css";

// Geri bildirim: /de/feedback?id=… (v1 adresi, e-postalarda). Dil, v1'deki gibi adresten gelir (kayıttan değil).
type Props = PageProps<"/[locale]/feedback">;

const O = OPERATOR;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "feedback" });
  return { title: t("kicker") };
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const raw = (await searchParams).id;
  const id = typeof raw === "string" ? raw : "";
  // v1 `done` bilgisini alır ama kullanmaz: formu yine gösterir (POST üzerine yazar). Aynısı korunuyor.
  const state = await getFeedbackState(id);
  const t = await getTranslations("feedback");
  const tl = await getTranslations("common.legal");
  return (
    <div className="wrap">
      <div className="kicker">{t("kicker")}</div>
      <h1>{t("title")}</h1>
      <p className="lead">{t("lead")}</p>
      <FeedbackForm id={id} valid={state !== null} />
      <footer><details><summary>{tl("imprint")}</summary><div id="imp">
        <p>{tl("imprintHead")}</p>
        <p>{O.company}<br />{O.address}<br />{`${tl("ceo")}: ${O.ceoName}`}<br />{O.register}<br />{`${tl("vat")} ${O.vatId}`}<br />{`${tl("phone")}: ${O.phone}`}<br />{`${tl("email")}: `}<a href={`mailto:${O.email}`}>{O.email}</a></p>
      </div></details></footer>
    </div>
  );
}
