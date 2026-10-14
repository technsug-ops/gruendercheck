// Onaylanan raporu saklar, başvurana link gönderir, başvurunun durumunu günceller.
import { put } from '@vercel/blob';
import { sendReport } from './mail.js';

export const SITE = 'https://foundercheck.de';
export const reportUrl = (rec) => `${SITE}/${rec.lang === 'tr' ? 'tr' : 'de'}/r?id=${rec.id}`;
export const feedbackUrl = (rec) => `${SITE}/${rec.lang === 'tr' ? 'tr' : 'de'}/feedback?id=${rec.id}`;

/**
 * @param rec       başvuru kaydı (pathname'deki JSON)
 * @param pathname  submissions/… yolu
 * @param md        rapor Markdown'ı
 */
export async function publishReport(rec, pathname, md) {
  const now = new Date().toISOString();
  await put(`reports/${rec.id}.json`, JSON.stringify({ id: rec.id, lang: rec.lang === 'tr' ? 'tr' : 'de', md, sent_at: now }, null, 2), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
  const mail = await sendReport(rec, reportUrl(rec), feedbackUrl(rec));
  if (mail && mail.ok === false) return { ok: false, error: 'mail', detail: mail.error, url: reportUrl(rec) };
  if (!rec.status || rec.status === 'new') { rec.status = 'report_sent'; rec.status_changed_at = now; }
  rec.report_sent_at = now;
  const { pathname: _p, draft: _d, report: _r, plan: _pl, ...clean } = rec;
  await put(pathname, JSON.stringify(clean, null, 2), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
  return { ok: true, url: reportUrl(rec), mail_skipped: !!(mail && mail.skipped) };
}
