// Tüm metinlerin kaydı (sunucu tarafı). Her dilin dosyaları Almanca dosyalarla AYNI yapıda olmak zorunda:
// tr'nin tipi de'den türetilir; bir anahtar eksik/fazla ise proje derlenmez. Yeni dil eklerken burayı da doldur.
import type { Locale } from "@/i18n/routing";
import deCheck from "./de/check.json";
import deCommon from "./de/common.json";
import deConfirm from "./de/confirm.json";
import deFeedback from "./de/feedback.json";
import deMail from "./de/mail.json";
import dePlan from "./de/plan.json";
import deReport from "./de/report.json";
import deStart from "./de/start.json";
import trCheck from "./tr/check.json";
import trCommon from "./tr/common.json";
import trConfirm from "./tr/confirm.json";
import trFeedback from "./tr/feedback.json";
import trMail from "./tr/mail.json";
import trPlan from "./tr/plan.json";
import trReport from "./tr/report.json";
import trStart from "./tr/start.json";

const de = { common: deCommon, start: deStart, check: deCheck, report: deReport, feedback: deFeedback, plan: dePlan, confirm: deConfirm, mail: deMail };
export type Messages = typeof de;

const tr: Messages = { common: trCommon, start: trStart, check: trCheck, report: trReport, feedback: trFeedback, plan: trPlan, confirm: trConfirm, mail: trMail };

export const MESSAGES: Record<Locale, Messages> = { de, tr };
