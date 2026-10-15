import { beforeAll, describe, expect, it } from "vitest";

// MAIL_DRY=1: nodemailer jsonTransport, hiçbir şey gönderilmez.
beforeAll(() => {
  Object.assign(process.env, { MAIL_DRY: "1", SMTP_USER: "test", SMTP_PASS: "test", MAIL_FROM: "rapor@example.org", NOTIFY_TO: "halil@example.org" });
});

describe("mail = v1", () => {
  it("onay, rapor ve bildirim e-postaları aynı", async () => {
    const v1 = await import("../legacy/lib/mail.js");
    const { confirmApplicant, dryOutbox, notifyAdmin, sendReport } = await import("@/lib/mail");
    const parse = (r: object) => {
      const m = JSON.parse(String((r as { raw?: unknown }).raw));
      return { to: m.to[0].address, subject: m.subject, text: m.text };
    };
    for (const lang of ["de", "tr", "xx"]) {
      for (const name of ["Ayşe", "", "  Çok   uzun bir isim ki kırk karakteri rahatlıkla aşıyor olmalı  "]) {
        const old = { lang, first_name: name, email: "a@example.org" }, neu = { lang, firstName: name, email: "a@example.org" };
        dryOutbox.length = 0;
        await confirmApplicant(neu, "https://foundercheck.de/api/confirm?id=x&t=y");
        await sendReport(neu, "https://foundercheck.de/de/r?id=x", "https://foundercheck.de/de/feedback?id=x");
        expect(dryOutbox[0]).toEqual(parse(await v1.confirmApplicant(old, "https://foundercheck.de/api/confirm?id=x&t=y")));
        expect(dryOutbox[1]).toEqual(parse(await v1.sendReport(old, "https://foundercheck.de/de/r?id=x", "https://foundercheck.de/de/feedback?id=x")));
      }
    }
    for (const kind of ["submit", "plan", "feedback", "draft", "draft_error", "draft_insufficient"] as const) {
      const rec = { lang: "tr", src: "insta", city: "Frankfurt am Main, Bockenheim und noch viel mehr Text", feedback: { useful: "4", next: "plan", wtp: "50-150" } };
      dryOutbox.length = 0;
      await notifyAdmin(kind, rec);
      expect(dryOutbox[0]).toEqual(parse(await v1.notifyAdmin(kind, rec)));
    }
  });
});
