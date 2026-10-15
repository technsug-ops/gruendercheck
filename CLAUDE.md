# Gründungs-Check / İş Fikri Kontrolü (foundercheck.de)

Yeni bir iş fikri için Almanya'ya özel ön kontrol raporu: kişi formu doldurur, e-postasını onaylar, Claude bir rapor taslağı yazar, Halil (TechNS UG) onaylar, rapor e-postayla gider.

**Şu anki durum:** Canlıdaki v1 (düz HTML/JS + Vercel Functions + Vercel Blob) `legacy/` klasöründe; v1'i yayınlamak gerekirse `legacy/` klasöründen yayınlanır. Kökte yeni sürüm: Next.js 16 + TypeScript + PostgreSQL (Neon, Drizzle). Plan ve ilerleme: `MIGRATION.md`. Taşıma bitene kadar v1 canlıda kalır. Next 16 API'leri farklı: kod yazmadan önce `node_modules/next/dist/docs/` (bkz. `AGENTS.md`).

## Kurallar
- **Dil:** Kullanıcıya görünen her metin Almanca (`/de`) ve Türkçe (`/tr`). İkisi birlikte değişir. Hitap "du" / "sen".
- **Gizlilik:** Claude API'ye isim ve e-posta gitmez (`legacy/brief.js` → `briefText`). Çerezsiz ölçüm dışında takip yok. Datenschutz metni (formda) koda uygun kalmalı; yeni bir veri işleme eklenirse metni de güncelle.
- **Sırlar:** API anahtarları ve şifreler sadece Vercel ortam değişkenlerinde (Sensitive). Koda, dosyaya, commit'e asla yazılmaz.
- **Rapor kalitesi:** Rapor talimatı ve kural tabanı `legacy/lib/kb.js` içinde (kaynak: claude.ai projesindeki RAPOR-TALIMATI.md ve ALMANYA-KURAL-TABANI.md). Rapor iç kaynaklara atıf yapmaz ("kural tabanı", "Halil" vb.); bkz. `legacy/lib/draft.js` OUTPUT_RULES.
- **Tasarım:** Kurumsal, beyaz zemin, lacivert `#0f2d4a`, sistem yazı tipi (Segoe UI/Roboto), serif yok. Büyük harfli küçük etiketler, "·" ile ayrılmış satırlar, → okları kullanma. Uydurma yorum/logo yok.
- **Hukuk:** Rapor hukuki/vergisel danışmanlık değildir; resmi makam gibi görünen tasarım veya ifade kullanma.

## Sayfa taşıma kalıbı (adım 4)
- v1 sayfasının `<style>` içeriği **olduğu gibi** `app/[locale]/<sayfa>/<ad>.css` dosyasına kopyalanır ve sadece o sayfada içe aktarılır (her sayfanın kendi `:root` renkleri var). Sayfalar arası link `<a>` (tam sayfa yükleme), `next/link` değil; CSS'ler karışmasın.
- Metinler `messages/<de|tr>/<sayfa>.json`; yeni ad alanı `i18n/request.ts` NAMESPACES listesine eklenir.
- Veri sunucuda `lib/data/*` ile okunur; kayıt/gönderim v1 ile aynı `/api/...` sözleşmesiyle.
- Doğrulama: `npm run db:seed`, `npx next build && npx next start -p 3200`, `npm run visual:legacy`, `npm run visual:compare` → v1 ile piksel karşılaştırması (`scripts/visual/pages/*.ts`). Bilinçli farklar `known` ile gerekçesiyle yazılır.
