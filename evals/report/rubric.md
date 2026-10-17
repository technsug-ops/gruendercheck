# Rapor değerlendirme ölçütleri (Halil onayı 2026-10-17)

Kaynak: Halil'in dört şikâyeti (yüzeysel / hukuki hata / sayılar zayıf / dil, 2026-10-17) ve "iyi rapor" örneği olarak verdiği gerçek bir danışmanlık strateji raporu. Her ölçüt kontrol edilebilir bir iddia; mümkün olan her yerde kodla (programatik), geri kalanı ayrı bir değerlendirici modelle (judge) puanlanır.

## A. Kişiye özel ve derin (danışmanlık raporu çıtası)
1. Kişinin kendi verisine dayanıyor: şehri/eyaleti, sektörü, verdiği rakamlar ve endişesi rapor metninde somut olarak geçiyor; başka bir başvuruya kopyalanabilecek genel cümleler raporun çoğunluğunu oluşturmuyor. *(judge)*
2. Ürüne/sektöre özgü kısıtları söylüyor (ör. raf ömrü, soğuk zincir, sezon, kapasite, iade). *(judge)*
3. Pazar ve rakip bilgisi ya kaynaklı (gerçek ad, fiyat, kaynak) ya da açıkça "(varsayım)" — uydurma rakip/rakam yok. *(judge + programatik: kaynaksız rakip adı)*
4. Yerel ve somut yönlendirme: hangi IHK/HWK, hangi makam, hangi program; "ilgili makam" gibi boş ifadeler değil. *(judge)*

## B. Hukuki ve resmi doğruluk
5. KONTROLLER'deki her "kesin" engel raporun ilk sayfasında, çözüm yolu + süre + maliyetle. *(programatik: anahtar terimler)*
6. Doğrulanan "olası" engeller de var; fikirle ilgisiz olanlar yok. *(judge)*
7. Kural tabanıyla çelişen veya kural tabanında olmayan kesin hukuki iddia yok; ⚠️ kurallar "⚠️ doğrulanmalı" diye işaretli. *(judge)*
8. Hessen dışı başvuruda Hessen'e özgü program/kural önerilmiyor. *(programatik)*

## C. Sayılar
9. HESAPLAR'daki ana rakamlar (başabaş, nakit dip noktası, sermaye açığı) raporda aynen. *(programatik)*
10. Varsayımlar "(varsayım)" diye işaretli; nokta tahmin yerine aralık. *(programatik + judge)*
11. Sektörün zorunlu ek hesabı var: mekanda kira/ciro, online'da katlanılabilir müşteri edinme maliyeti (CAC), kapasite. *(programatik)*

## D. Karar ve uygulanabilirlik
12. Skor satırı geçerli; renk skor eşiğine ve engellere uygun (çözümsüz engel → kırmızı). *(programatik)*
13. İlk 30 gün deneyleri 4 satırlık kalıpta, ucuzdan pahalıya, gerçekten bu kişiye özgü. *(programatik kalıp + judge)*
14. Kişinin endişesine (soru 13) doğrudan cevap var. *(judge)*

## E. Dil ve okunabilirlik
15. Raporun dili formun dili; hitap sen/du; iç kaynak yok ("kural tabanı", "Halil", "HESAPLAR", "talimat"). *(programatik)*
16. İlk sayfa tek başına yeterli; toplam ~3 sayfa sınırı. *(programatik: uzunluk)*
17. Doğal dil: çeviri kokan kalıplar, gereksiz uzun cümleler, boş övgü yok (Türkçe için Almanya'daki Türk okurun günlük dili). *(judge)*

## F. Girdi kalitesi
18. Anlamsız/boş başvuruda rapor yazılmıyor (YETERSİZ). *(programatik)*

## Bilerek dışarıda bırakılanlar (geri alınabilir)
- Görsel düzen ve grafik sayısı: rapor sayfası bunları zaten biçimliyor; içerik kalitesiyle aynı şeyi ölçmez.
- "Halil'in son raporuna benzerlik" (referans eşleme): az sayıda referans var ve benzerlik, modeli bir yazım tarzını taklit etmeye iter; yerine ölçüt bazlı puan.
- Maliyet ve süre kalite puanına katılmaz; ayrı sütunda (rapor başına $, saniye) gösterilir.
