# İş planı ürünü: profesyonel örnekle karşılaştırma (2026-10-17)

Kaynak: Halil'in verdiği, bir danışmanlık firmasının gerçek bir şirket için hazırladığı iş planı ve 5 yıllık finans planı (25 + 59 sayfa). Belge "üçüncü kişilere verilemez" kaydı taşıdığı için repoya içerik alınmadı; bu not sadece yapı ve farkları kendi cümlelerimizle özetler.

## Örnekteki yapı
**Metin (≈25 sayfa):** Yönetici özeti → 5P/2S analizi (Product, Place, People, Price, Promotion, Sales, Service) → şirket ve iş fikri → ürünler → vizyon ve strateji → pazar ve hedef bölge (rakamlarla) → rakipler → hedef müşteriler → pazarlama → yönetim ve organizasyon → fırsatlar ve riskler. Başta: girişimcinin verdiği rakamların "makul hale getirildiği" notu ve kullanıcının kendi incelemesini yapması gerektiği uyarısı.

**Finans (≈59 sayfa, 5 yıl):** varsayımlar → maliyet ve finansman planı → hızlı test → asgari ciro ve güvenlik payı → gelir tablosu (GuV) → bilanço → nakit akışı → likidite → yıllar arası karşılaştırma ve grafikler → kişi başı/oran göstergeleri (öz kaynak oranı, borç ödeme süresi, toplam sermaye kârlılığı, nakit akışı oranı) ve bunların notlanması (finansal istikrar, kazanç gücü, iflas riski) + terimler sözlüğü. Finansman araçları: KfW kredisi, mikro mezanin fonu, kısa vadeli kredi hattı (Kontokorrent).

## Bizim iş planı motoruyla (lib/domain/plan.ts) farkları
| Konu | Örnek | Bizde | Öneri |
|---|---|---|---|
| Süre | 5 yıl | 3 yıl (36 ay) | Bankalar çoğunlukla 3–5 yıl ister; 5 yıla uzatmak kolay (yıllık büyüme oranıyla) |
| Bilanço | var | yok | Basit bilanço (varlıklar, öz kaynak, borç) eklenebilir |
| Vergi | gelir/kurumlar vergisi dahil | **hariç** (vergi öncesi) | En büyük fark: UG/GmbH'de KSt + GewSt, Einzelunternehmen'de GewSt (Freibetrag) ve gelir vergisi tahmini |
| Asgari ciro, güvenlik payı | var | başabaş var, güvenlik payı yok | Güvenlik payı = (beklenen − asgari ciro) / asgari ciro |
| Oranlar ve not | var (sözlükle) | yok | Öz kaynak oranı, borç ödeme süresi, kapital servis gücü; banka dilinde |
| Finansman araçları | KfW, mezanin, Kontokorrent | öz kaynak, aile, banka, hibe, Gründungszuschuss | Kontokorrent hattı ve mikro mezanin eklenebilir |
| Metin bölümleri | 11 bölüm, 5P/2S | Claude yazıyor (talimat claude.ai projesinde) | 5P/2S ve "fırsatlar/riskler" yapısı iyi bir şablon |

## Örneğin zayıf yanları (bizim üstün olabileceğimiz yerler)
- Pazar rakamları kaynaksız ("uzmanlara göre"); fiyat bölümü belirsiz ("türe ve miktara göre").
- Sektöre özgü hukuki konular (gıda/et ithalatı izinleri, etiketleme) neredeyse hiç yok — bizim kural tabanı + KONTROLLER yaklaşımı burada fark yaratır.

## Ön kontrol raporuna aktarılabilecekler
- Güvenlik payı (asgari ciroya göre ne kadar boşluk var) tek satır olarak.
- 5P/2S'nin kısa hali "fikrin özeti" için çerçeve olabilir (rapor 3 sayfayı geçmemeli).

## İkinci örnek: kamuya açık, kurgusal örnek iş planı (2013, çocuk kitapçısı)
Klasik Arbeitsagentur/banka yapısı: özet → kurucu profili → iş fikri → ürün → pazar → rekabet → yer → pazarlama ve satış → organizasyon → 3 yıllık plan ve senaryolar → sermaye ihtiyacı ve finansman → planlı gelir-gider hesabı (aylık likidite) → ekler.
- **Bizim motorla uyumlu:** kişisel yaşam gideri dökümü (kira, sağlık sigortası, gönüllü işsizlik sigortası, **gelir vergisi için ayrılan pay**) → "gerekli girişimci geliri"; sermaye ihtiyacı uzun / orta-kısa vadeli / işletme sermayesi / kuruluş giderleri diye gruplu ve her kalemin finansman kaynağı yanında; 3 yıl aylık likidite.
- **Bizde eksik:** kişisel giderde gelir vergisi payı; kalem bazında finansman kaynağı; senaryo (iyi/kötü) tablosu.
- **Örneğin zayıflığı:** "senaryolar" başlığı altında senaryo yok; ayırt edici özellik olarak cephe rengi ve logo. Resmi örnekler de sığ olabilir — bizim çıtamız bu değil.
- **Kaynak fikri:** sektör rakamları için bankaların sektör raporları ("Branchenbriefe" — VR bankaları, Sparkassen) → kural tabanındaki "sektör maliyet normları" boşlukları için.
- **Sektöre özgü kural örneği:** kitapta sabit fiyat (Buchpreisbindungsgesetz) → kural tabanında sektör kuralları bölümü gerekiyor.

## Resmi çerçeve: IHK Hannover, "Businessplan: Ideen in Form bringen" (bilgi notu, 2013)
Kaynak: IHK'nın kamuya açık bilgi notu (özet, alıntı değil).
- **Biçim:** kapak (kurucu iletişim + fikir tek cümle), içindekiler, 1–2 sayfa özet (kim / ne ve neden başarılı olur / hangi rakamlar), metin, rakamlar, ek (özgeçmiş, sözleşme ve teklif taslakları). Çoğu plan için 10–25 sayfa; başarı için kritik konu uzun, önemsiz konu kısa; uzman olmayan okur için anlaşılır.
- **Metin başlıkları:** kurucu/ekip/ağ (nitelik + motivasyon + **"buna yasal olarak hakkım var mı?"** — erişim kısıtları, güvenilirlik, uzmanlık kanıtı) · ürün/hizmet · pazar bilgisi · yer · rekabet · pazarlama · personel/organizasyon · şirket türü · gelecek. İş kolları farklıysa ayrı ayrı analiz.
- **Rakamlar (4 soru):** ne kadar tutar (sermaye ihtiyacı: yatırım, işletme sermayesi, başlangıç, kuruluş ve danışmanlık giderleri) · kim öder (finansman planı; kredi hattının büyüklüğü likiditeden) · nasıl likit kalırım (en az 1 yıl aylık likidite; ciro planı iş koluna göre, çekişler dahil) · ne kalır (3 yıllık kârlılık).
- **Bizim motorla uyum:** 4 sorunun hepsi `plan.ts`'te var. Eksik: likiditeden kredi hattı (Kontokorrent) büyüklüğü; iş koluna göre ayrı metin analizi (talimatta).
- **Ön kontrol raporu için çıkarım:** rehberin "yasal olarak yapabilir miyim" vurgusu, raporun ilk sayfasındaki engel kontrolünün (KONTROLLER) doğru öncelik olduğunu doğruluyor.
