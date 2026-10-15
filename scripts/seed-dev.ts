// Yerel geliştirme verisi (PGlite). Çalıştır: npm run db:seed  (dev sunucusu kapalıyken)
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { devAnswers, DEV_IDS, devReportMd, DEV_SENT_AT } from "./dev-data";

async function main() {
  if (process.env.DATABASE_URL) throw new Error("Sadece yerel veritabanı için (DATABASE_URL boş olmalı)");
  const d = await db();
  for (const lang of ["de", "tr"] as const) {
    const id = DEV_IDS[lang];
    await d.delete(schema.submissions).where(eq(schema.submissions.id, id));
    await d.insert(schema.submissions).values({
      id, lang, status: "report_sent", confirmed: true, email: `dev-${lang}@example.org`, firstName: "Dev",
      answers: devAnswers(lang), consentAt: new Date(), confirmedAt: new Date(), reportSentAt: new Date(DEV_SENT_AT),
    });
    await d.insert(schema.reports).values({ submissionId: id, md: devReportMd(lang), sentAt: new Date(DEV_SENT_AT) });
    console.log(`${lang}: http://localhost:3000/${lang}/r?id=${id}`);
  }
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
