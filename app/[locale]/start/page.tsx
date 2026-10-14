import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

// Tanıtım sayfası (v1: landing.html). Adım 4'te taşınacak.
export default function StartPage({ params }: PageProps<"/[locale]/start">) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("start");
  return <main><h1>{t("title")}</h1></main>;
}
