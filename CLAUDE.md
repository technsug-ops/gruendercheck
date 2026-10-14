# Gründungs-Check / İş Fikri Kontrolü (foundercheck.de)

Yeni bir iş fikri için Almanya'ya özel ön kontrol raporu: kişi formu doldurur, e-postasını onaylar, Claude bir rapor taslağı yazar, Halil (TechNS UG) onaylar, rapor e-postayla gider.

**Şu anki durum:** Bu klasör çalışan v1 sürümü (düz HTML/JS + Vercel Functions + Vercel Blob). Hedef: Next.js + TypeScript + PostgreSQL'e taşımak. Plan: `MIGRATION.md`. Taşıma bitene kadar v1 canlıda kalır.

## Kurallar
- **Dil:** Kullanıcıya görünen her metin Almanca (`/de`) ve Türkçe (`/tr`). İkisi birlikte değişir. Hitap "du" / "sen".
- **Gizlilik:** Claude API'ye isim ve e-posta gitmez (`brief.js` → `briefText`). Çerezsiz ölçüm dışında takip yok. Datenschutz metni (formda) koda uygun kalmalı; yeni bir veri işleme eklenirse metni de güncelle.
- **Sırlar:** API anahtarları ve şifreler sadece Vercel ortam değişkenlerinde (Sensitive). Koda, dosyaya, commit'e asla yazılmaz.
- **Rapor kalitesi:** Rapor talimatı ve kural tabanı `lib/kb.js` içinde (kaynak: claude.ai projesindeki RAPOR-TALIMATI.md ve ALMANYA-KURAL-TABANI.md). Rapor iç kaynaklara atıf yapmaz ("kural tabanı", "Halil" vb.); bkz. `lib/draft.js` OUTPUT_RULES.
- **Tasarım:** Kurumsal, beyaz zemin, lacivert `#0f2d4a`, sistem yazı tipi (Segoe UI/Roboto), serif yok. Büyük harfli küçük etiketler, "·" ile ayrılmış satırlar, → okları kullanma. Uydurma yorum/logo yok.
- **Hukuk:** Rapor hukuki/vergisel danışmanlık değildir; resmi makam gibi görünen tasarım veya ifade kullanma.
