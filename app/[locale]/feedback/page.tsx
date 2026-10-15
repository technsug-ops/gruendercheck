import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFeedbackState } from "@/lib/data/feedback";
import FeedbackForm from "./FeedbackForm";
import "./feedback.css";

// Geri bildirim: /de/feedback?id=… (v1 adresi, e-postalarda). Dil, v1'deki gibi adresten gelir (kayıttan değil).
type Props = PageProps<"/[locale]/feedback">;

// v1'deki OPERATOR (Impressum). Diğer sayfalar taşınınca ortak bir yere alınabilir.
const O = {
  company: "TechNS UG (haftungsbeschränkt)", address: "Ludwig-Erhard-Str. 16A, 61440 Oberursel (Taunus), Deutschland",
  register: "Amtsgericht Bad Homburg, HRB 16236", vat: "USt-IdNr. DE312006599", ceo: "Geschäftsführer: Halil Yaprakli",
  phone: "+49 6171 277 51 37", email: "info@dgitmarkt.de",
};

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
