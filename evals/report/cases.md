# Değerlendirme vakaları — genel bakış

16 vaka. Üretildi: `npx tsx evals/report/overview.ts`. "geçerli": form gönderiminden (zorunlu alanlar + kalite kontrolü) geçerdi; anlamsız girdi vakası bilerek kalite kontrolüne takılır.

| vaka | tür | dil | form | engel (KONTROLLER) | HESAPLAR |
|---|---|---|---|---|---|
| derived-baklava-online | derived | tr | geçerli | meister | uyarı: 1 |
| derived-digital-agency | derived | tr | geçerli | — | ok |
| derived-gold-online | derived | de | geçerli | — | uyarı: 1 |
| real-junk-input | real | tr | kalite: idea,current_solution | — | uyarı: 1 |
| real-medienagentur | real | de | geçerli | — | eksik: ortalama fiyat |
| sample-kinderbuchhandlung | sample | de | geçerli | — | uyarı: 1 |
| syn-abroad-saas | syn | tr | geçerli | oturum | uyarı: 1 |
| syn-berber-student | syn | tr | geçerli | oturum, meister | uyarı: 2 |
| syn-bluecard-sideline | syn | de | geçerli | oturum | uyarı: 1 |
| syn-cafe-koeln | syn | de | geçerli | meister | uyarı: 2 |
| syn-cocktailbar | syn | de | geçerli | — | uyarı: 2 |
| syn-dguv-alg1 | syn | tr | geçerli | meister | uyarı: 1 |
| syn-foodtruck-price-unknown | syn | tr | geçerli | — | uyarı: 1 |
| syn-nachhilfe-online | syn | tr | geçerli | — | uyarı: 1 |
| syn-negative-margin | syn | de | geçerli | — | uyarı: 1 |
| syn-reinigung-buergergeld | syn | tr | geçerli | — | uyarı: 1 |

## Vakalar

### derived-baklava-online

Kaynak: Halil'in gerçek bir danışmanlık vakasından türetildi (online tatlı satışı strateji raporu, Haziran 2026); işletme adı, sosyal medya hesapları, şube devri ve ayırt edici ayrıntılar çıkarıldı, şehir eyalet düzeyine genelleştirildi. Halil onayı 2026-10-17.

Zor yanları: Zor yanları: mevcut işletme (yeni kuruluş değil); Konditor/Bäcker Anlage A (üretim + işletmelere satış, Türk ustalık belgesi → denklik); online gıda satışı yükümlülükleri (kural tabanında henüz yok: LUCID, LMIV mesafeli satış, bozulabilir gıdada cayma istisnası, AB'ye satışta OSS-KDV); künefe/katmer soğuk zincir; Hessen dışı (Niedersachsen); influencer başarısızlığının nedeni (ölçüm altyapısı yok).

````text
Fikir: Kendi baklava ve tatlı imalathanemiz ve dükkânımız var; hem bireysel müşterilere hem kafe ve restoranlara satıyoruz. Baklavayı kendi online mağazamız üzerinden kargoyla önce Almanya'ya, sonra Fransa, Hollanda ve Belçika'ya satmak istiyoruz. Künefe ve katmeri de online denemek istiyoruz.
Bugünkü çözüm: Müşteriler bugün büyük online baklava satıcılarından alıyor; 1 kg Antep fıstıklı baklava kargo dahil yaklaşık 35–45 €. Bizden ise sadece dükkâna gelerek alabiliyorlar.
Deneyim: 15 yıldır baklava ustasıyım, Türkiye'de ustalık belgem var; dükkânı 6 yıldır işletiyorum. Google'da yorumlarımız çok iyi ama online satış ve reklam konusunda deneyimim yok.
Endişe: Daha önce influencer reklamı verdik ama satış gelmedi. Kargo pahalı ve ürün yolda bozulursa ne olacak, bilmiyorum.
Şehir: Niedersachsen (büyük şehir) · oturum: settlement · durum: self_employed · saat/hafta: 40 · kurucu: 1 · sermaye: 5-15k
İşin türü: online_products · müşteri: both · gelir modeli: one_time · fiyat: 39 · birim maliyet: 14 · sabit gider: 1500 · kira: — · yatırım: 8000
````

KONTROLLER: oturum/bilgi · meister/engel · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi · eksik bilgi/bilgi

### derived-digital-agency

Kaynak: Halil'in gerçek bir iş planı çalışmasından türetildi (360° dijital ajans, Ağustos 2026); marka adları ve ekip ayrıntıları çıkarıldı, rakamlar plandan. Halil onayı 2026-10-17.

Zor yanları: Zor yanları: 2+ kurucu ve ≥25.000 € sermaye → GmbH; kapsam riski (dört alan, dört kişi); Fotograf B1 bildirimi; sağlık reklamı yasası HWG ve serbest çalışanlar için Künstlersozialkasse payı kural tabanında yok (model 'doğrula' demeli, uydurmamalı); kişisel ihtiyaç maaşlara dahil (0); sabit giderin büyüklüğü.

````text
Fikir: Almanya'daki Türk toplumuna ve KOBİ'lere yönelik dört kişilik bir dijital ajans kurmak istiyoruz: düğün ve kurumsal video/fotoğraf prodüksiyonu, estetik klinikler ve diş hekimleri için dijital markalaşma ve hasta kazanımı, KOBİ'lere sosyal medya ve SEO, restoranlara dijital menü ve QR menü. İlk 3 ay sadece düğün prodüksiyonu ve klinik markalaşmasıyla başlayıp diğer ikisini 4. aydan sonra açmayı planlıyoruz.
Bugünkü çözüm: Düğünler için bugün tek tek fotoğrafçı ve video ekibi tutuluyor, paket 3.500–6.000 €. Klinikler genel ajanslarla çalışıyor ve sağlık reklamı kurallarını bilmeyen ajanslar yüzünden sorun yaşıyor.
Deneyim: Ekipte iki prodüksiyoncu, bir pazarlama uzmanı ve yazılım bilen bir kurucu var. Düğün çekimi ve sosyal medya yönetiminde birkaç yıllık serbest çalışma deneyimimiz var.
Endişe: Kötümser senaryoda sermaye 5.–7. ayda bitiyor. İlk altı ayda yeterli müşteri bulabilir miyiz, dört alanı birden yönetebilir miyiz?
Şehir: Köln · oturum: settlement · durum: employed_full · saat/hafta: 40 · kurucu: 3+ · sermaye: 50k+
İşin türü: online_service · müşteri: both · gelir modeli: project · fiyat: 4500 · birim maliyet: 900 · sabit gider: 15200 · kira: — · yatırım: 17800
````

KONTROLLER: oturum/bilgi · meister/bilgi · freiberuf/bilgi · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı

### derived-gold-online

Kaynak: Halil'in gerçek bir web sitesi raporundan türetildi (değerli maden işletmesi, Frankfurt, Haziran 2026); işletme adı, alan adı ve sağlayıcı ayrıntıları çıkarıldı. Halil onayı 2026-10-17.

Zor yanları: Zor yanları: GwG kimlik eşiği (kural tabanı: nakitte 2.000 €; kaynak rapor: tüm siparişlerde 2.000 €+ → çelişki, doğrulanmalı) ve goAML; yatırım altını KDV muafiyeti (§25c UStG) vs gümüş; mevcut işletme, 2 kurucu; 'Preis' burada sipariş başına ortalama marj (komisyon modeli); Hessen (Mikrodarlehen uygun olabilir).

````text
Fikir: Wir haben ein Ladengeschäft für Gold- und Silberbarren und Anlagemünzen in Frankfurt und wollen einen Online-Shop für Privatkunden starten: Preise live nach Börsenkurs, Versand versichert, Abholung im Laden möglich.
Bugünkü çözüm: Kunden kaufen heute bei großen Online-Edelmetallhändlern oder bei der Bank. Der Aufpreis über dem Börsenkurs liegt je nach Produkt bei etwa 3–8 %.
Deneyim: Wir führen seit 8 Jahren ein Edelmetallgeschäft vor Ort und kennen den Markt, aber nicht den Online-Handel.
Endişe: Wie gehen wir online mit der Geldwäsche-Identifizierung um, ohne dass Kunden im Checkout abspringen? Und was müssen wir rechtlich auf der Website zeigen?
Şehir: Frankfurt am Main · oturum: de_eu · durum: self_employed · saat/hafta: 40 · kurucu: 2 · sermaye: 5-15k
İşin türü: online_products · müşteri: b2c · gelir modeli: commission · fiyat: 45 · birim maliyet: 12 · sabit gider: 600 · kira: — · yatırım: 4000
````

KONTROLLER: oturum/bilgi · izin/uyarı · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · vergi/bilgi · teşvik/bilgi · eksik bilgi/bilgi

### real-junk-input

Kaynak: v1 deneme girişi (tüm alanlar anlamsız). v1 bunun için 9.370 karakterlik rapor yazıp gönderdi: beklenen davranış YETERSİZ



````text
Fikir: fds
Bugünkü çözüm: fds
Deneyim: fdsfsd
Endişe: fdsf
Şehir: fds · oturum: settlement · durum: employed_full · saat/hafta: 32 · kurucu: 1 · sermaye: 0-5k
İşin türü: onsite_service · müşteri: b2c · gelir modeli: one_time · fiyat: 55.99 · birim maliyet: 32 · sabit gider: 3232 · kira: — · yatırım: 3232
````

KONTROLLER: oturum/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi

### real-medienagentur

Kaynak: v1 gerçek başvuru, anonimleştirildi (PLZ → Hochtaunuskreis, deneyimde ayırt edici ayrıntı genelleştirildi); Halil onayı 2026-10-17



````text
Fikir: "Ich möchte eine Medienagentur gründen. In vielen Restaurants sind die Speisekarten sehr ähnlich. Es soll kurze Videos geben, die fotografierte Versionen eines Großteils dieser Gerichte zeigen. Interessenten können dann gegen eine Gebühr ein beliebiges Video personalisieren lassen und auf ihrer eigenen Website einbinden."
Bugünkü çözüm: Viele Restaurants geben für ähnliche Arbeiten sehr viel Geld aus. Wir bieten einen vergleichsweise günstigeren Zugang und eine schnellere Produktion
Deneyim: Ich habe einen Master in Wirtschaftswissenschaften, habe an vielen Projekten im Bereich der Künstlichen Intelligenz (KI) gearbeitet und Erfahrung im Aufbau einer Bildungseinrichtung.
Endişe: Ich bin gut in der Produktion, habe aber Schwierigkeiten beim Marketing.
Şehir: Hochtaunuskreis · oturum: settlement · durum: employed_part · saat/hafta: 15 · kurucu: 1 · sermaye: 0-5k
İşin türü: online_service · müşteri: b2b · gelir modeli: — · fiyat: — · birim maliyet: 5 · sabit gider: 50 · kira: — · yatırım: 2000
````

KONTROLLER: oturum/bilgi · meister/bilgi · freiberuf/bilgi · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi

### sample-kinderbuchhandlung

Kaynak: Kamuya açık, kurgusal örnek iş planından ("Muster eines Unternehmenskonzeptes", Mart 2013: Kinder- und Jugendbuchhandlung, Musterstadt) form cevaplarına çevrildi; kişi ve yer kurgusal. Halil onayı 2026-10-17.

Zor yanları: Zor yanları: çok düşük marj (kitapta sabit fiyat — Buchpreisbindung, kural tabanında yok; model uydurmamalı, 'doğrula' veya genel bilgi), büyük stok finansmanı (kaynak plan: 100.000 € mal, KfW StartGeld), ALG I + Gründungszuschuss sırası ve tarihleri, Hessen dışı (NRW), mekan: kira/ciro ve kapasite. Kaynak plandaki zayıflık (ayırt edici özellik = cephe rengi) raporda dürüstçe söylenmeli.

````text
Fikir: Ich eröffne eine Buchhandlung für Kinder- und Jugendliteratur mit Ladenlokal und eigenem Online-Shop. Zielgruppe sind Kinder, Eltern, Großeltern sowie Kindergärten und Schulen. Neben Büchern verkaufe ich Hörbücher, E-Books und Papeterie.
Bugünkü çözüm: Familien kaufen heute in großen Buchhandelsketten in der Innenstadt oder online bei großen Versandhändlern; Kitas bestellen beim Großhandel.
Deneyim: Ausbildung zur Buchhändlerin, seit 2006 Fachwirtin des Buchhandels (IHK), seit vielen Jahren in Buchhandlungen angestellt, gute Kontakte zu Verlagen.
Endişe: Der Buchhandel ist schwierig und die Preise sind durch die Buchpreisbindung festgelegt. Reicht die Marge, um davon zu leben, und wie finanziere ich den Warenbestand?
Şehir: Bielefeld · oturum: de_eu · durum: alg1 · saat/hafta: 45 · kurucu: 1 · sermaye: 15-50k
İşin türü: location · müşteri: both · gelir modeli: one_time · fiyat: 14 · birim maliyet: 9,5 · sabit gider: 1200 · kira: 450 · yatırım: 21520
````

KONTROLLER: oturum/bilgi · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · teşvik/uyarı · bölge/uyarı · teşvik/bilgi · eksik bilgi/bilgi · eksik bilgi/bilgi

### syn-abroad-saas

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Yurt dışından: §21 oturumu (Abs. 1 koşulları, 45 yaş üstü emeklilik) — 'yapabilirsin' denmemeli; Türk vatandaşı → ARB 1/80 🔴; yazılım Freiberuf vaka bazlı; abonelik CAC tavanı; net fiyat (B2B); Berlin (Hessen dışı).

````text
Fikir: İstanbul'da yaşıyorum, Almanya'ya gelip Berlin'de küçük restoranlar için rezervasyon ve sipariş yönetimi yapan bir yazılım (aylık abonelik) satmak istiyorum.
Bugünkü çözüm: Restoranlar bugün kâğıt defter ya da pahalı uluslararası sistemler kullanıyor; ayda 80–200 € ödüyorlar.
Deneyim: Bilgisayar mühendisiyim, 8 yıldır yazılım geliştiriyorum, Türkiye'de kendi yazılım şirketim var.
Endişe: Hangi vizeyle gelmeliyim ve şirketi nasıl kurmalıyım?
Şehir: Berlin · oturum: abroad · durum: self_employed · saat/hafta: 50 · kurucu: 1 · sermaye: 15-50k
İşin türü: online_service · müşteri: b2b · gelir modeli: subscription · fiyat: 79 · birim maliyet: 6 · sabit gider: 900 · kira: — · yatırım: 8000
````

KONTROLLER: oturum/engel · oturum/uyarı · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi · eksik bilgi/bilgi

### syn-berber-student

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: İki engel üst üste: öğrenci oturumu (Ausländerbehörde onayı) ve Friseur Anlage A (Türk ustalık belgesi → denklik/§8, §7b şartları sağlanmıyor). Sermaye yatırımın çok altında.

````text
Fikir: Offenbach'ta küçük bir erkek berberi açmak istiyorum: saç kesimi, sakal tıraşı ve cilt bakımı. Türk ve Arap müşterilerin çok olduğu bir semtte, uygun fiyatlı ve randevusuz çalışan bir dükkân düşünüyorum.
Bugünkü çözüm: Semtte zaten birkaç berber var; insanlar 15–25 € ödüyor ama cumartesi saatlerce bekliyorlar.
Deneyim: Türkiye'de 5 yıl berber olarak çalıştım, ustalık belgem var. Almanya'da 2 yıldır öğrenciyim ve hafta sonları bir berberde yardım ediyorum.
Endişe: Öğrenci vizesiyle dükkân açabilir miyim, Almanya'da berberlik için hangi belge gerekiyor?
Şehir: Offenbach am Main · oturum: student · durum: student · saat/hafta: 20 · kurucu: 1 · sermaye: 0-5k
İşin türü: location · müşteri: b2c · gelir modeli: one_time · fiyat: 20 · birim maliyet: 2 · sabit gider: 1800 · kira: 1100 · yatırım: 9000
````

KONTROLLER: oturum/engel · oturum/uyarı · meister/engel · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · teşvik/bilgi · eksik bilgi/bilgi · eksik bilgi/bilgi · eksik bilgi/bilgi

### syn-bluecard-sideline

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Blaue Karte: yan serbest faaliyet için §21 Abs. 6 izni ⚠️ → engel (izin gerekli), çözüm yolu; danışmanlık genelde Gewerbe; Kleinunternehmer; işveren bildirimi/rekabet yasağı kural tabanında yok; Baden-Württemberg.

````text
Fikir: Neben meinem Job als Ingenieur möchte ich am Wochenende kleine Unternehmen bei der Einführung von Cloud-Software beraten, vor allem türkischsprachige Handwerksbetriebe.
Bugünkü çözüm: Die Betriebe machen das heute selbst oder beauftragen IT-Systemhäuser für 90–140 € pro Stunde.
Deneyim: Master in Informatik, seit 4 Jahren Cloud-Ingenieur in einem Konzern, Blaue Karte seit 2 Jahren.
Endişe: Darf ich mit der Blauen Karte überhaupt nebenbei selbstständig sein?
Şehir: Stuttgart · oturum: blue_card · durum: employed_full · saat/hafta: 8 · kurucu: 1 · sermaye: 0-5k
İşin türü: online_service · müşteri: b2b · gelir modeli: project · fiyat: 800 · birim maliyet: 0 · sabit gider: 80 · kira: — · yatırım: 300
````

KONTROLLER: oturum/engel · oturum/uyarı · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi · eksik bilgi/bilgi

### syn-cafe-koeln

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Gastronomi + üretim: ağırlık noktası (sipariş pasta → Konditor Anlage A riski); NRW (Hessen dışı); kira/ciro oranı ve kapasite; gastronomi KDV karışımı; iki kurucu, yüksek risk → UG; aile birleşimi oturumu serbest.

````text
Fikir: Ein kleines Café in Köln-Ehrenfeld mit Frühstück, Kaffee und selbstgebackenen Kuchen und Torten, die wir auch auf Bestellung für Geburtstage verkaufen wollen.
Bugünkü çözüm: Im Viertel gibt es mehrere Cafés und Bäckereien; ein Stück Kuchen kostet dort 3,50–4,50 €, Bestelltorten 35–60 €.
Deneyim: Ich backe seit Jahren privat und habe 3 Jahre im Service eines Cafés gearbeitet. Meine Partnerin hat Erfahrung im Einzelhandel.
Endişe: Reicht der Umsatz für die hohe Miete, und dürfen wir die Torten ohne Meister verkaufen?
Şehir: Köln · oturum: family · durum: employed_part · saat/hafta: 40 · kurucu: 2 · sermaye: 15-50k
İşin türü: location · müşteri: b2c · gelir modeli: one_time · fiyat: 6,5 · birim maliyet: 1,8 · sabit gider: 3800 · kira: 2200 · yatırım: 45000
````

KONTROLLER: oturum/bilgi · meister/engel · meister/uyarı · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi · eksik bilgi/bilgi · eksik bilgi/bilgi

### syn-cocktailbar

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Alkollü servis: Hessen'de izin yok, açılıştan 6 hafta önce bildirim + hijyen + Bauamt (Nutzungsänderung) → gelirsiz bekleme; nargile (Jugendschutz/Nichtraucherschutz kural tabanında yok); yüksek yatırım vs sermaye; iki kurucu, yüksek risk → UG/GmbH.

````text
Fikir: Eine kleine Cocktailbar in Offenbach mit Snacks, DJ-Abenden am Wochenende und Shisha im Außenbereich.
Bugünkü çözüm: Die Leute fahren heute nach Frankfurt in die Bars, Cocktails kosten dort 11–14 €.
Deneyim: Ich arbeite seit 6 Jahren als Barkeeper, mein Partner führt seit 4 Jahren ein Restaurant als Schichtleiter.
Endişe: Welche Genehmigungen brauchen wir und wie lange dauert das, bis wir öffnen dürfen?
Şehir: Offenbach am Main · oturum: settlement · durum: employed_full · saat/hafta: 50 · kurucu: 2 · sermaye: 15-50k
İşin türü: location · müşteri: b2c · gelir modeli: one_time · fiyat: 12 · birim maliyet: 2,8 · sabit gider: 6500 · kira: 2800 · yatırım: 60000
````

KONTROLLER: oturum/bilgi · izin/uyarı · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · teşvik/bilgi · eksik bilgi/bilgi

### syn-dguv-alg1

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Elektrotechniker Anlage A (sadece test bile; VG Halle ⚠️), AB dışı mühendis diploması §7 Abs. 2 kapsamında değil → denklik/§8; Gründungszuschuss: 150 gün, Bescheid tarihi yok → kesin tarih yazılmamalı, ön kontrol sorusu; AVGS sırası; Wallbox Installateurverzeichnis.

````text
Fikir: Frankfurt ve çevresindeki küçük işletmelere taşınabilir elektrikli cihazların DGUV V3 testini yapmak istiyorum. İleride elektrikli araç şarj istasyonu (Wallbox) kurulumu da eklemek istiyorum.
Bugünkü çözüm: İşletmeler bugün büyük test firmalarını çağırıyor; cihaz başına 4–8 € ve yol ücreti ödüyorlar, randevu haftalar sürüyor.
Deneyim: Türkiye'de elektrik mühendisliği okudum, 10 yıl fabrikada bakım mühendisi olarak çalıştım. Almanya'da 3 yıl elektrik firmasında teknisyen olarak çalıştım. Diplomamın denkliği yok.
Endişe: İşsizlik parası alıyorum. Gründungszuschuss alabilir miyim ve son ne zamana kadar başvurmam gerekiyor?
Şehir: Frankfurt am Main · oturum: settlement · durum: alg1 · saat/hafta: 40 · kurucu: 1 · sermaye: 5-15k
İşin türü: onsite_service · müşteri: b2b · gelir modeli: project · fiyat: 450 · birim maliyet: 40 · sabit gider: 900 · kira: — · yatırım: 7000
````

KONTROLLER: oturum/bilgi · meister/engel · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · teşvik/uyarı · vergi/bilgi · teşvik/bilgi · eksik bilgi/bilgi · eksik bilgi/bilgi

### syn-foodtruck-price-unknown

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Fiyatı bilmiyor → rakip fiyatı; seyyar satış (§55 Reisegewerbekarte) + pazar/festival izinleri + gıda hijyeni; döner hazır şiş mi kendi üretim mi (Fleischer sınırı, ön kontrol sorusu); Niedersachsen; yüksek yatırım.

````text
Fikir: Bir döner food truck'ı ile hafta içi sanayi bölgelerinde, hafta sonu pazarlarda ve festivallerde satış yapmak istiyorum.
Bugünkü çözüm: İnsanlar öğlen sanayi bölgesinde ya fırından ya da kantinden yiyor. Şehirdeki dönerciler 7,50–9 € alıyor.
Deneyim: 10 yıl bir döner dükkânında usta olarak çalıştım.
Endişe: Food truck için hangi izinler gerekiyor ve her şehirde ayrı izin mi lazım?
Şehir: Hannover · oturum: settlement · durum: employed_full · saat/hafta: 45 · kurucu: 1 · sermaye: 15-50k
İşin türü: other · müşteri: b2c · gelir modeli: one_time · fiyat: bilinmiyor, rakip 8,5 · birim maliyet: 3,2 · sabit gider: 1400 · kira: — · yatırım: 38000
````

KONTROLLER: oturum/bilgi · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi

### syn-nachhilfe-online

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Freiberuf (öğretim), Kleinunternehmer, yan iş (işveren bildirimi kural tabanında yok → uydurma yok); kişisel ihtiyaç 0 (ana işten geçiniyor); Baden-Württemberg; özel derste KDV muafiyeti 🔴.

````text
Fikir: Almanya'daki Türk ailelerin çocuklarına online Türkçe ve matematik özel dersi vermek istiyorum. Haftada birkaç akşam, birebir ve küçük gruplarla.
Bugünkü çözüm: Aileler bugün tanıdık öğretmenlere ya da büyük özel ders platformlarına saat başı 20–35 € ödüyor.
Deneyim: Türkiye'de 6 yıl sınıf öğretmenliği yaptım, Almanya'da bir okulda öğretmen yardımcısıyım.
Endişe: Ana işimin yanında bunu yapmak için işverenime söylemem gerekiyor mu, vergi nasıl oluyor?
Şehir: Mannheim · oturum: de_eu · durum: employed_full · saat/hafta: 8 · kurucu: 1 · sermaye: 0-5k
İşin türü: online_service · müşteri: b2c · gelir modeli: one_time · fiyat: 28 · birim maliyet: 0 · sabit gider: 60 · kira: — · yatırım: 500
````

KONTROLLER: oturum/bilgi · freiberuf/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · bölge/uyarı · teşvik/bilgi

### syn-negative-margin

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Zararına satış: fiyat 25 € < maliyet 27 € (KDV sonrası daha da kötü) → HESAPLAR katkı payı negatif uyarısı; rapor bunu ilk sayfada söylemeli, pazarlama tavsiyesine geçmeden; kimseyle konuşulmamış (talep boyutu ≤ 3); iade oranı/CAC; Sachsen.

````text
Fikir: Ein Online-Shop für hochwertige Yogamatten und Zubehör aus Kork, Versand in ganz Deutschland.
Bugünkü çözüm: Kunden kaufen bei großen Sportversendern oder Marken-Shops, Korkmatten kosten dort 60–90 €.
Deneyim: Ich bin Yogalehrerin und habe keinen Hintergrund im Online-Handel.
Endişe: Wie bekomme ich die ersten Kunden ohne großes Werbebudget?
Şehir: Leipzig · oturum: de_eu · durum: employed_part · saat/hafta: 15 · kurucu: 1 · sermaye: 5-15k
İşin türü: online_products · müşteri: b2c · gelir modeli: one_time · fiyat: 25 · birim maliyet: 27 · sabit gider: 450 · kira: — · yatırım: 6000
````

KONTROLLER: oturum/bilgi · freiberuf/bilgi · rechtsform/bilgi · bölge/uyarı

### syn-reinigung-buergergeld

Kaynak: Sentetik: kural tabanı ve hedef kitlenin tipik zor durumlarından türetildi (gerçek kişi yok). Halil onayı bekliyor.

Zor yanları: Bürgergeld → Einstiegsgeld (takdire bağlı ⚠️); Gebäudereiniger Anlage B1 (kural tabanında örnek olarak yok → model 'HWK'ya bildirim, doğrula' demeli, Meister dememeli); abonelik modeli (aylık sözleşme = abone); NRW; çalışan almak (kural tabanında personel kuralı yok).

````text
Fikir: Dortmund'da ofislere ve apartman merdivenlerine temizlik hizmeti vermek istiyorum. Başta kendim çalışacağım, işler artınca 1–2 yardımcı almayı düşünüyorum.
Bugünkü çözüm: Ofisler büyük temizlik firmalarıyla çalışıyor ya da kayıt dışı temizlikçi buluyor; saat başı 22–30 € ödeniyor.
Deneyim: 4 yıl bir temizlik firmasında çalıştım, ekip başıydım.
Endişe: Bürgergeld alıyorum. İş kurarsam Jobcenter yardımı hemen keser mi, destek alabilir miyim?
Şehir: Dortmund · oturum: settlement · durum: buergergeld · saat/hafta: 40 · kurucu: 1 · sermaye: 0-5k
İşin türü: onsite_service · müşteri: b2b · gelir modeli: subscription · fiyat: 480 · birim maliyet: 60 · sabit gider: 350 · kira: — · yatırım: 2500
````

KONTROLLER: oturum/bilgi · rechtsform/bilgi · vergi/bilgi · vergi/bilgi · teşvik/bilgi · bölge/uyarı · teşvik/bilgi

