// E-posta: all-inkl SMTP üzerinden. Ayarlar Vercel ortam değişkenlerinde.
// Gönderim hatası kaydı asla bozmaz; sadece loglanır.
import nodemailer from 'nodemailer';

const ADMIN_URL = 'https://foundercheck.de/admin';
let transport;
function tx() {
  if (transport) return transport;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transport = process.env.MAIL_DRY === '1'
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'w022397f.kasserver.com', port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
      });
  return transport;
}
const FROM_ADDR = () => process.env.MAIL_FROM || 'rapor@gruenderchek.de';
const short = (s, n = 80) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

async function send(msg) {
  const t = tx();
  if (!t) { console.warn('mail: SMTP not configured'); return { skipped: true }; }
  try { const info = await t.sendMail(msg); return { ok: true, id: info.messageId, raw: info.message }; }
  catch (err) { console.error('mail failed', err && err.message); return { ok: false, error: err && err.message }; }
}

/** Halil'e bildirim: kişisel veri minimum, ayrıntı yönetici sayfasında. */
export function notifyAdmin(kind, rec) {
  const to = process.env.NOTIFY_TO;
  if (!to) return Promise.resolve({ skipped: true });
  const label = { submit: 'Yeni başvuru', plan: 'Plan formu geldi', feedback: 'Geri bildirim geldi', draft: 'Rapor taslağı hazır – onay bekliyor', draft_error: 'Rapor taslağı oluşturulamadı', draft_insufficient: 'Başvuru yetersiz – rapor yazılmadı' }[kind] || kind;
  // Fikir metni ve kişisel veri e-postaya konmaz (Gmail'e aktarım olmasın); ayrıntı yönetici sayfasında.
  const lines = [`${label} (${(rec.lang || 'de').toUpperCase()}${rec.src ? ', kanal: ' + rec.src : ''}${rec.city ? ', ' + short(rec.city, 40) : ''})`];
  if (kind === 'feedback' && rec.feedback) lines.push(`Fayda: ${rec.feedback.useful}/5 · Sıradaki adım: ${rec.feedback.next} · Ödeme isteği: ${rec.feedback.wtp}`);
  lines.push('', `Yönetici sayfası: ${ADMIN_URL}`);
  return send({ from: `Gründungs-Check <${FROM_ADDR()}>`, to, subject: `${label} – Gründungs-Check`, text: lines.join('\n') });
}

const CONFIRM = {
  de: (name, url) => ({
    from: 'Gründungs-Check',
    subject: 'Bitte bestätige deine E-Mail – Gründungs-Check',
    text: `Hallo${name ? ' ' + name : ''},\n\ndanke für deine Angaben zum Gründungs-Check. Bitte bestätige kurz deine E-Mail-Adresse, damit wir deinen Bericht erstellen können:\n${url}\n\nNach der Bestätigung bekommst du deinen Bericht in etwa 30 Minuten.\n\nDu hast den Gründungs-Check nicht angefordert? Dann ignoriere diese E-Mail. Unbestätigte Angaben löschen wir nach 7 Tagen.\n\nViele Grüße\nGründungs-Check\n\n—\nTechNS UG (haftungsbeschränkt) · Ludwig-Erhard-Str. 16A · 61440 Oberursel\nDer Bericht ist eine allgemeine Information und keine Rechts- oder Steuerberatung.`,
  }),
  tr: (name, url) => ({
    from: 'İş Fikri Kontrolü',
    subject: 'Lütfen e-postanı onayla – İş Fikri Kontrolü',
    text: `Merhaba${name ? ' ' + name : ''},\n\nbilgilerin için teşekkürler. Raporunu hazırlayabilmemiz için lütfen e-posta adresini onayla:\n${url}\n\nOnaydan sonra raporun yaklaşık 30 dakika içinde gelir.\n\nBu kontrolü sen istemediysen bu e-postayı dikkate alma. Onaylanmayan bilgileri 7 gün sonra siliyoruz.\n\nSelamlar\nİş Fikri Kontrolü\n\n—\nTechNS UG (haftungsbeschränkt) · Ludwig-Erhard-Str. 16A · 61440 Oberursel\nRapor genel bilgidir, hukuki veya vergisel danışmanlık değildir.`,
  }),
};

/** Başvurana e-posta onay linki; formun dilinde. */
export function confirmApplicant(rec, url) {
  const c = (CONFIRM[rec.lang] || CONFIRM.de)(short(rec.first_name, 40), url);
  return send({ from: `${c.from} <${FROM_ADDR()}>`, to: rec.email, replyTo: FROM_ADDR(), subject: c.subject, text: c.text });
}

const REPORT = {
  de: (name, url, fb) => ({
    from: 'Gründungs-Check',
    subject: 'Dein Bericht ist fertig – Gründungs-Check',
    text: `Hallo${name ? ' ' + name : ''},\n\ndein persönlicher Bericht zu deiner Geschäftsidee ist fertig:\n${url}\n\nAuf der Seite kannst du ihn auch als PDF speichern.\n\nWar der Bericht hilfreich? Zwei Minuten Rückmeldung helfen uns sehr:\n${fb}\n\nFragen beantworten wir gern – antworte einfach auf diese E-Mail.\n\nViele Grüße\nGründungs-Check\n\n—\nTechNS UG (haftungsbeschränkt) · Ludwig-Erhard-Str. 16A · 61440 Oberursel\nDer Bericht ist eine allgemeine Information und keine Rechts- oder Steuerberatung.`,
  }),
  tr: (name, url, fb) => ({
    from: 'İş Fikri Kontrolü',
    subject: 'Raporun hazır – İş Fikri Kontrolü',
    text: `Merhaba${name ? ' ' + name : ''},\n\nfikrine özel raporun hazır:\n${url}\n\nSayfadan PDF olarak da kaydedebilirsin.\n\nRapor işine yaradı mı? İki dakikalık geri bildirimin bize çok yardımcı olur:\n${fb}\n\nSorun olursa bu e-postaya cevap yazman yeterli.\n\nSelamlar\nİş Fikri Kontrolü\n\n—\nTechNS UG (haftungsbeschränkt) · Ludwig-Erhard-Str. 16A · 61440 Oberursel\nRapor genel bilgidir, hukuki veya vergisel danışmanlık değildir.`,
  }),
};

/** Onaylanan raporun linkini başvurana gönderir. */
export function sendReport(rec, url, fb) {
  const c = (REPORT[rec.lang] || REPORT.de)(short(rec.first_name, 40), url, fb);
  return send({ from: `${c.from} <${FROM_ADDR()}>`, to: rec.email, replyTo: FROM_ADDR(), subject: c.subject, text: c.text });
}
