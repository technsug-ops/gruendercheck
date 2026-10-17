// next-intl'e metinlerin ve dillerin tipini tanıt: t("…") anahtarları derleme anında kontrol edilir.
import type { Locale } from "./routing";
import type { Messages } from "@/messages";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
