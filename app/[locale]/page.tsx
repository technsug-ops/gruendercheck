import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

// Form (v1: app.html). Adım 4'te taşınacak.
export default function CheckPage({ params }: PageProps<"/[locale]">) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("common");
  return <main><h1>{t("brand")}</h1></main>;
}
