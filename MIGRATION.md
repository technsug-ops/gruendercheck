# Taşıma planı: v1 → Next.js + TypeScript + PostgreSQL

Amaç: aynı ürün, aynı görünüm, aynı adresler. Kullanıcı farkı görmemeli; Halil admin'de daha hızlı ve güçlü bir panel görmeli.

## 1. Teknoloji

| Katman | Seçim | Not |
|---|---|---|
| Çatı | Next.js (App Router) + TypeScript | Vercel'de, bölge `fra1` |
| Veritabanı | PostgreSQL – Neon (Vercel Marketplace, bölge Frankfurt) | Supabase da olur; veri AB'de kalmalı |
| ORM | Drizzle ORM + drizzle-kit (migration) | |
| Diller | next-intl, rotalar `/de/...` ve `/tr/...` | Metinler `messages/de.json`, `messages/tr.json` |
| Stil | Mevcut CSS token'ları (CSS Modules veya global CSS) | Görünüm v1 ile aynı kalsın |
| Claude | `@anthropic-ai/sdk`, model `ANTHROPIC_MODEL` (varsayılan claude-sonnet-5-5) | Kural tabanı prompt cache ile |
| E-posta | nodemailer + ALL-INKL SMTP (şimdilik) | İleride Resend/Postmark |
| Arka plan işi | `after()` (Next.js) veya `waitUntil` | Taslak yazımı 1–3 dk |
| Zamanlı işler | Vercel Cron | Silme süreleri (aşağıda) |
| İstatistik | `@vercel/analytics` (`<Analytics />`) + admin'de Vercel API | Çerezsiz |
| PWA | `app/manifest.ts` + mevcut `sw.js` | |
| Ödeme (sonra) | Stripe Checkout | İş planı satışı |
| Test | Vitest (hesaplar) + Playwright (uçtan uca akış) | |

## 2. Klasör yapısı (öneri)

```
app/
  [locale]/start/page.tsx             ← landing.html   (/ = /de/start, proxy rewrite; /tr/start)
  [locale]/page.tsx                   ← app.html (form) (/de, /tr – v1 ile aynı)
  [locale]/r/page.tsx                 ← bericht.html   (/de/r?id=… – v1 ile aynı)
  [locale]/feedback/page.tsx          ← feedback.html  (/de/feedback?id=…)
  [locale]/plan/page.tsx              ← plan.html      (/de/plan?id=…)
  admin/...                           ← admin.html + rapor.html (dil öneki yok)
  api/...                             ← route handler'lar (/api/confirm?id=&t= v1 ile aynı)
  icon.svg, apple-icon.png, manifest.ts
proxy.ts                               ← next-intl (Next 16'da middleware → proxy)
i18n/routing.ts  i18n/request.ts       ← dil algılama ve dil çerezi kapalı
lib/
  domain/calc.ts  plan.ts  brief.ts  quality.ts   ← v1'den birebir (TS'ye çevir)
  report/render.ts                                 ← render.js (rapor Markdown → HTML)
  ai/draft.ts  kb.ts                               ← lib/draft.js, lib/kb.js
  mail.ts  ratelimit.ts  auth.ts
  db/schema.ts  db/index.ts                        ← drizzle/0000_init.sql
messages/de.json  messages/tr.json
scripts/import-blob.ts                             ← v1 verisini taşır
legacy/                                            ← v1 (canlıdaki kod, referans)
```

Karar: v1 adresleri birebir korunur (sorgu parametreleri dahil), böylece eski e-postalardaki linkler için yönlendirme gerekmez. `cacheComponents` kapalı (sayfalar kişiye özel, dinamik).

## 3. Veri modeli (Drizzle)

- `submissions`: id (uuid), created_at, lang, status, confirmed, confirm_token_hash, confirmed_at, src, email, first_name, answers (jsonb – formdaki tüm alanlar), consent_at
- `drafts`: submission_id, state (pending/ready/insufficient/error), md, precheck, message, model, seconds, usage (jsonb), error, created_at, edited_at
- `reports`: submission_id, md, sent_at
- `feedback`: submission_id, useful, best, missing, next, wtp, created_at
- `plans`: submission_id, data (jsonb), created_at, updated_at
- `rate_limits`: key_hash, ts – veya basit sayaç tablosu

Not: `confirm_token` düz değil hash'lenmiş saklansın.

## 4. v1'den taşınacak mantık (kaybolmamalı)

- Kalite kontrolü (`lib/quality.js`) – hem istemcide hem sunucuda
- Sıklık sınırı: e-posta başına 3/gün, IP başına 6/gün
- Çift onay (double opt-in): GET sadece düğme gösterir, onay POST ile olur (link tarayıcıları onaylamasın)
- Onaysız başvurular 7 gün sonra silinir
- Taslak: `===HALİL===` / `===RAPOR===` / `===YETERSİZ===` protokolü, "Yine de rapor yaz" (force), `AUTO_SEND=1` seçeneği
- Rapor görsel blokları: `{{skor}}`, `{{kpi}}`, `{{grafik}}`/`{{bar}}`, "Puan" sütununda noktalar, ⚠️ ve "(varsayım)" etiketleri
- Admin: durumlar, karar kapısı (5 takip / 2 ödeme isteği), kanal (`?k=`) istatistiği, KDV seçimi, Claude için kopyala, plan CSV, İstatistik sekmesi
- Honeypot alanı (`website`)
- Bildirim e-postaları Halil'e (NOTIFY_TO), başvurana: onay e-postası ve rapor e-postası

## 5. v1'deki eksikler – yeni sürümde kapat

- **90 gün silme sözü:** Datenschutz "rapordan en geç 90 gün sonra silinir" diyor ama v1'de otomatik silme yok. Yeni sürümde Vercel Cron ile günlük silme işi yaz (submissions + bağlı tablolar).
- Admin girişi şu an Bearer şifre + sessionStorage. Yeni sürümde HttpOnly, Secure çerezle oturum (sadece admin; giriş için gerekli çerez, onay gerekmez).
- Taslak "pending" durumunda kalırsa (fonksiyon zaman aşımı) admin'de "takıldı" uyarısı.

## 6. Ortam değişkenleri (değerler Vercel'de; isimler aynı kalsın)

`ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_WEB_SEARCH`, `AUTO_SEND`, `MAIL_DRY`, `MAIL_FROM`, `NOTIFY_TO`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `VERCEL_API_TOKEN`, yeni: `DATABASE_URL` (Neon entegrasyonu otomatik ekler), `CRON_SECRET`.

## 7. Adımlar

1. ✅ (yerel; GitHub remote henüz yok) **Repo:** GitHub'da private repo. v1 kodu `legacy/` klasörüne (referans için), yeni Next.js projesi kökte.
2. ✅ (Neon bağlantısı hariç – migration üretildi, DB'ye uygulanmadı) **İskelet:** `create-next-app` (TypeScript, App Router, ESLint), next-intl, Drizzle, Neon bağlantısı, ilk migration.
3. **Saf mantık:** `calc`, `plan`, `brief`, `quality`, `render` dosyalarını TS'ye çevir; Vitest ile v1 çıktılarıyla aynı sonucu verdiğini test et.
4. **Sayfalar:** landing → form → onay → rapor → geri bildirim → plan. Görünüm v1 ile birebir (ekran görüntüsü karşılaştırması).
5. **API'ler:** submit, confirm, draft (arka plan), report, feedback, plan, stats, submissions (admin).
6. **Admin:** mevcut panelin tüm işlevleri + İstatistik.
7. **Veri taşıma:** `scripts/import-blob.ts` – Vercel Blob'daki `submissions/`, `drafts/`, `reports/`, `plans/`, `feedback` verisini Postgres'e aktarır (birden çok kez çalıştırılabilir olsun).
8. **Uçtan uca test:** Playwright ile: kötü giriş reddedilir → iyi giriş → onay e-postası (MAIL_DRY) → onay → taslak → admin onayı → rapor sayfası → geri bildirim.
9. **Geçiş:** Yeni Vercel projesinde önizleme ile test → veri taşıma → `foundercheck.de` ve `gruenderchek.de` alan adlarını yeni projeye taşı → eski projeyi 2 hafta yedek olarak tut. Eski adresler (`/de`, `/tr`, `/de/r?id=`, `/tr/feedback?id=` …) yönlendirmeyle çalışmaya devam etmeli; e-postalardaki linkler kırılmasın.

## 8. Sonra (karar kapısı geçilince)
Stripe ile iş planı satışı, kullanıcı hesabı / "raporlarım" sayfası, `noindex`'in kaldırılması ve SEO, gerçek müşteri yorumları.
