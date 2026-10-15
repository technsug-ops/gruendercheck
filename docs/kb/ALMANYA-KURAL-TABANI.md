> Kaynak: konsept dokümanının "Almanya kural tabanı" sekmesi (15.10.2026 dışa aktarım). Değişiklik önce orada yapılır.

# Almanya Kural Tabanı

Oct 13, 2026 · @Halil

## Özet

Bu sekme, rapor motorunun Almanya için kullandığı kuralların ilk sürümüdür: 8 karar alanı, her kuralın kaynağı ve kontrol tarihi. Kodda JSON karar tablolarına dönüşecek; buradaki metin Steuerberater'ın okuyup düzelteceği insan okunur sürümdür.

**Durum etiketleri:** ✅ resmi kaynaktan doğrulandı (13.10.2026) · ⚠️ bilinen mevzuattan yazıldı, kaynak okunmadı, doğrulama bekliyor · 🔴 avukat/Steuerberater görüşü şart.

**İlk bulgu:** IHK'nın hala dağıttığı Nebenerwerb broşürü 2021 tarihli ve Kleinunternehmer eşiğini 22.000/50.000 €, Buchführung sınırını 600.000/60.000 € gösteriyor; ikisi de artık geçersiz. Resmi kaynaklar bile eskiyor — her kuralın yanında kontrol tarihi bu yüzden zorunlu.

## 1. Freiberuf mi, Gewerbe mi

Rapor motorunun ilk sorusu budur; Gewerbesteuer, IHK üyeliği, Gewerbeanmeldung ve Buchführung kuralları bu cevaba bağlı. ⚠️ (§18 EStG metni bilinen mevzuattan; gesetze-im-internet.de otomatik okumaya kapalı.)

**Freiberuf (§18 Abs. 1 Nr. 1 EStG) — üç yol:**

- **Katalog meslekleri:** hekim, diş hekimi, veteriner, avukat, noter, patent avukatı, ölçüm mühendisi, mühendis, mimar, Handelschemiker, Wirtschaftsprüfer, Steuerberater, beratender Volks- und Betriebswirt, vereidigter Buchprüfer, Steuerbevollmächtigter, Heilpraktiker, fizyoterapist, gazeteci, foto muhabiri, tercüman, çevirmen, kılavuz kaptan.
- **Benzer meslekler:** eğitim ve faaliyet olarak katalog mesleğine eşdeğer olanlar (örn. diploma olmadan ama mühendis düzeyinde yazılım geliştirme — BFH içtihadı, vaka bazlı).
- **Faaliyet türü:** bilimsel, sanatsal, yazarlık, öğretim, eğitim.

**Koşul:** çalışan istihdam edilebilir, ama kurucu "yönetici ve kendi sorumluluğunda" kalmalı. Ticari bir faaliyetle karışırsa (örn. ders veren biri aynı zamanda kitap satarsa) karma faaliyet → ayrı hesaplanmazsa tümü Gewerbe sayılabilir (Abfärbetheorie).

| Fikir türü (kitlemizde sık) | Muhtemel sınıf | Not |
| --- | --- | --- |
| Özel ders, kurs, dil eğitimi | Freiberuf (öğretim) | Kurs merkezi + ders materyali satışı → karma risk |
| Çeviri, tercümanlık | Freiberuf (katalog) | Yeminli tercümanlık ayrıca mahkeme ataması ister |
| Yazılım geliştirme (sözleşmeli) | Vaka bazlı | Diploma veya eşdeğer bilgi + mühendislik niteliği → Freiberuf; aksi Gewerbe |
| Grafik, fotoğraf, içerik üretimi | Genelde Freiberuf (sanatsal/gazetecilik) | Reklam amaçlı üretim sınırda |
| İşletme / pazarlama danışmanlığı | Genelde Gewerbe | "beratender Betriebswirt" ancak işletme diploması veya eşdeğeri ile |
| Eğitim/üniversite danışmanlığı, başvuru aracılığı | Gewerbe | Komisyon/aracılık geliri → ticari |
| E-ticaret, alım-satım, arbitraj | Gewerbe | — |
| Restoran, imbiss, kafe | Gewerbe | Hessen'de alkol için bildirim (bölüm 5) |
| Berber, kuaför | Gewerbe + Handwerk | Meisterpflicht (bölüm 4) |

**Rapor davranışı:** sınır durumlarda motor "muhtemelen Freiberuf, ama Finanzamt'ın Fragebogen zur steuerlichen Erfassung değerlendirmesi belirleyici" der ve Steuerberater kapısını açar. Kesin hüküm vermez.

## 2. Rechtsform karşılaştırması

Tek kurucu ve düşük riskte Einzelunternehmen; sorumluluk sınırı gerekiyorsa UG; yatırımcı veya ciddi sermaye varsa GmbH. Bu üç dal kullanıcıların %90'ını kapsar. ⚠️ (IHK Frankfurt genel sayfası rakam vermiyor; rakamlar GmbHG ve bilinen noter/register ücretlerinden, alt sayfalardan doğrulanacak.)

| Form | Kurucu | Sermaye | Sorumluluk | Kayıt | Kuruluş maliyeti (yaklaşık) | Muhasebe |
| --- | --- | --- | --- | --- | --- | --- |
| Freiberufler | 1 | yok | şahsi, sınırsız | Finanzamt (Fragebogen) | 0 € | EÜR |
| Einzelunternehmen (Kleingewerbe) | 1 | yok | şahsi, sınırsız | Gewerbeamt | 20–65 € (şehre göre) | EÜR (bölüm 3 eşiklerine kadar) |
| e.K. (Einzelkaufmann) | 1 | yok | şahsi, sınırsız | Gewerbeamt + Handelsregister | ≈ 150–300 € | ticari işletme boyutunda bilanço |
| GbR | 2+ | yok | ortaklar müşterek, sınırsız | Gewerbeamt; Gesellschaftsregister isteğe bağlı (MoPeG, 2024) | 20–65 € + sözleşme | EÜR |
| UG (haftungsbeschränkt) | 1+ | min. 1 €; yıllık kârın %25'i 25.000 €'ya kadar yedek | şirket varlığı ile sınırlı | Noter + Handelsregister + Gewerbeamt | ≈ 300–800 € (Musterprotokoll ile alt uç) | Bilanço, Jahresabschluss, KSt + GewSt |
| GmbH | 1+ | 25.000 € (kuruluşta min. 12.500 € ödenmiş) | şirket varlığı ile sınırlı | Noter + Handelsregister + Gewerbeamt | ≈ 800–1.500 € | Bilanço, Jahresabschluss, KSt + GewSt |
| PartG / PartG mbB | 2+ serbest meslek | yok | ortaklar (mbB: mesleki hatada sınırlı) | Partnerschaftsregister | ≈ 200–400 € | EÜR |

**Karar kuralları (motor sırasıyla uygular):**

1. Kurucu sayısı 1 ve faaliyet Freiberuf → Freiberufler.
2. Kurucu sayısı 1, Gewerbe, sorumluluk riski düşük (ürün sorumluluğu yok, büyük sözleşme yok, çalışan yok) → Einzelunternehmen.
3. Sorumluluk riski orta/yüksek (gıda, üretim, inşaat, kira sözleşmesi > 2 yıl, çalışan) ve sermaye < 25.000 € → UG; sermaye ≥ 25.000 € veya yatırımcı → GmbH.
4. 2+ kurucu → risk düşükse GbR, yüksekse UG/GmbH; her durumda ortaklık sözleşmesi uyarısı.
5. Nebengewerbe ve test aşaması → Einzelunternehmen ile başla, ciro/risk arttığında UG'ye geçiş notu.

🔴 **Rapor uyarısı:** UG'de "1 € sermaye" kullanıcıyı yanıltır; noter, register ve ilk ayların giderleri için fiilen 1.000–3.000 € başlangıç sermayesi gerekir, aksi halde kuruluşta aşırı borçlanma (Überschuldung) riski oluşur.

## 3. Vergi eşikleri

Beş sayı rapordaki finans hesaplarının ve hukuki yol önerisinin çoğunu belirler.

| Kural | Eşik | Geçerlilik | Rapor davranışı | Durum |
| --- | --- | --- | --- | --- |
| Kleinunternehmerregelung (§19 UStG) | Önceki yıl ciro ≤ 25.000 € **ve** cari yıl ≤ 100.000 € | 01.01.2025'ten beri | Tahmini ciro 25.000 € altındaysa öner; B2B müşterili veya yüksek başlangıç yatırımlı işlerde dezavantajını (Vorsteuer yok) yaz | ✅ |
| Cari yılda 100.000 € aşılırsa | Aşıldığı andan itibaren KUR sona erer | 2025'ten beri | Nakit akışı simülasyonunda bu noktadan sonra %19 USt düş | ✅ |
| Gewerbesteuer Freibetrag | 24.500 € / yıl | Einzelunternehmen ve kişi ortaklıkları (UG/GmbH'da yok) | Kâr tahmini bu altındaysa GewSt = 0; üstündeyse Hebesatz ile hesapla (Frankfurt 460 %) | ✅ (IHK) / ⚠️ Hebesatz |
| Buchführungspflicht (§141 AO) | Ciro > 800.000 € **veya** kâr > 80.000 € | 2024'ten beri | Altında EÜR yeterli; üstünde çift taraflı kayıt ve Steuerberater maliyeti (≈ 2.000–5.000 €/yıl) | ✅ |
| Istversteuerung (§20 UStG) | Ciro ≤ 800.000 € | 2024'ten beri | USt, fatura kesilince değil ödeme gelince — nakit akışında varsayılan bu | ⚠️ |

**UG/GmbH için fark:** Kurumlar vergisi %15 + Solidaritätszuschlag + Gewerbesteuer (Freibetrag yok) ≈ Frankfurt'ta toplam %30–32. Kişisel gelir vergisi ile karşılaştırma ancak kâr ≈ 60.000 € üzerinde anlamlı; motor bunu sadece bilgi olarak gösterir.

**Nebengewerbe + işsizlik parası (ALG I):** haftada 15 saatin altında kalınmalı; aylık 165 €'nın üzerindeki kâr ALG'den düşülür (IHK Nebenerwerb Merkblatt). ⚠️ Belge 2021 tarihli, 165 € değeri Arbeitsagentur'dan doğrulanacak.

**Kontrol takvimi:** Hebesatz yıllık (belediye kararı), §19 ve §141 eşikleri her Ocak (Jahressteuergesetz), Grundfreibetrag her yıl.

### KDV oranları (sektöre göre)

Form fiyatı brüt sorar; motor bu tabloyla nete çevirir: net = brüt / (1 + oran). Kleinunternehmer'de KDV yok, net = brüt.

| Sektör / ürün | Oran | Not | Durum |
| --- | --- | --- | --- |
| Restoran, kafe, imbiss — yiyecek (yerinde ve paket) | %7 | 01.01.2026'dan beri kalıcı; yerinde ve paket aynı | ✅ IHK Frankfurt |
| Restoran, kafe — içecek | %19 | Paket/teslimatta ≥ %75 sütlü alkolsüz içecekler %7 | ✅ IHK Frankfurt |
| Gıda perakende (market, fırın satışı) | %7 | İçecekler ve bazı lüks gıdalar %19 | ⚠️ |
| Kitap, gazete, e-kitap | %7 | — | ⚠️ |
| Kuaför, berber, kozmetik, danışmanlık, e-ticaret (genel mal), zanaat hizmeti | %19 | Genel oran | ⚠️ |
| Özel ders, kurs | %0 veya %19 | Mesleki eğitim için Bildungsträger sertifikası ile muafiyet mümkün (§4 Nr. 21 UStG) | 🔴 Steuerberater |
| Sağlık meslekleri (Heilpraktiker, fizyoterapi) | %0 | Tedavi amaçlı hizmet muaf | ⚠️ |

**Gastronomide karışım varsayımı:** kullanıcı vermezse kafe için cironun %50'si içecek (%19) / %50'si yiyecek (%7) → ortalama net katsayı ≈ 0,887; restoran için %30 / %70 → ≈ 0,906. Raporda "(varsayım)" yazılır.

## 4. Meisterpflicht (Handwerksordnung)

Kitlemiz için en sık "engel" bu: **berber/kuaför, fırın, pastane, kasap** HwO Anlage A'da ve Meister ya da eşdeğer yeterlilik olmadan Handwerksrolle kaydı yapılamaz. Liste IHK Frankfurt'tan ✅ (53 meslek); istisnalar ⚠️.

| Kategori | Anlam | Kitlemizden örnek |
| --- | --- | --- |
| Anlage A (zulassungspflichtig) | Handwerkskammer'dan izin; Meister veya eşdeğeri gerekli | Friseur (38), Bäcker (30), Konditor (31), Fleischer (32), Kfz-Techniker (20), Elektrotechniker (25), Installateur/Heizungsbauer (24), Maler/Lackierer (10), Fliesenleger (42), Tischler (27), Glaser (39) |
| Anlage B1 (zulassungsfrei) | Sadece Handwerkskammer'a bildirim | Kosmetiker, Schuhmacher, Uhrmacher, Goldschmied, Fotograf (B1 listesi ayrıca okunacak) |
| Anlage B2 (handwerksähnlich) | Sadece bildirim | Änderungsschneiderei, Kosmetik/Nagelstudio benzeri, Bodenleger (liste okunacak) |
| Handwerk değil | IHK üyeliği, Gewerbeanmeldung yeterli | Döner/imbiss (yemek servisi Gastgewerbe), e-ticaret, danışmanlık |

**Meister olmadan yollar (Anlage A):** ⚠️

- **Ausübungsberechtigung §7b HwO ("Altgesellenregelung"):** Geselle + 6 yıl mesleki deneyim, bunun 4 yılı yönetici pozisyonda. Bazı sağlık meslekleri (Augenoptiker, Hörgeräteakustiker, Zahntechniker vb.) hariç. Friseur bu yola açık.
- **Ausnahmebewilligung §8 HwO:** Meister düzeyinde bilgi başka yoldan kanıtlanırsa (yabancı diploma, uzun deneyim) Handwerkskammer takdiri.
- **Betriebsleiter:** Kurucu Meister değilse, Meister unvanlı bir "teknik müdür" istihdam etmek; maliyet raporda gösterilmeli.
- **Yabancı yeterlilik:** Türkiye'deki ustalık belgesi için Anerkennungsverfahren (BQFG) — süre ve sonuç belirsiz, 🔴 Handwerkskammer'a sorulmalı.

**Rapor davranışı:** sektör Anlage A'daysa raporun Lokal Uygulanabilirlik boyutu otomatik olarak "kırmızı bayrak" alır, dört yol ve tahmini maliyet/süre listelenir. Berber fikri gelen biri ilk bunu görmeli, kira sözleşmesi imzaladıktan sonra değil.

### Sınır durumlar: gastronomi mi, el sanatı mı

Belirleyici olan işin **ağırlık noktası**. Kural üretim yöntemine (hazır karışım, makine) değil, işletmenin dışarıdan nasıl göründüğüne ve neyi satışının merkezinde tuttuğuna bakılır. Kaynak: IHK München Merkblatt (Stand 03/2020) ✅, bağlayıcı değil.

| Durum | Sınıf | Not |
| --- | --- | --- |
| Kafede kendi kek ve pastalarını pişirip sunmak | **Handwerk değil** (gastronomi) | IHK München açıkça listeliyor |
| Krep, waffle, pizza, hazır hamuru pişirmek (Aufbacken) | Handwerk değil | — |
| Ağırlık pasta/tatlı satışında (vitrin pastanesi, sipariş pasta, başka işletmelere satış) | **Konditor, Anlage A** | Meister veya §7b/§8 yolu |
| Ekmek, simit, börek üretip mağazada satmak | **Bäcker, Anlage A** | Kafe içinde servis gastronomi; fırın gibi satış el sanatı |
| Market/süpermarkette eti satışa hazır porsiyonlara kesmek, açık sucuk satmak | **Fleischer, Anlage A** | — |
| Imbiss'te döner servisi (hazır şiş alınarak) | Gastronomi | ⚠️ IHK München döneri ele almıyor |
| Döner şişi üretip başka işletmelere satmak | Fleischer veya sanayi — vaka bazlı | 🔴 Handwerkskammer |
| Catering / Partyservice | Ağırlık bir el sanatındaysa Handwerk, değilse gastronomi | — |

**Rapor davranışı:** gastronomi fikrinde üretim varsa motor "ağırlık noktası" sorusunu sorar ("Cironın çoğu oturan müşteriden mi, paket/sipariş ürün satışından mı?") ve sınıra yakınsa Handwerkskammer'a yönlendirir.

### Elektrik test hizmeti ve Wallbox

**Sadece test yapan firma da Meister kuralına girer.** Yaygın inanışın aksine, IHK kaydı yetmez. Halle İdare Mahkemesi (VG Halle, 12.01.2022, 3 A 78/19 HAL) elektrikli cihaz, tesis ve makine testini Elektrotechniker zanaatının esaslı bir parçası saydı: test tehlikeli, kısa bir kursla öğrenilemez, bu yüzden Anlage A Nr. 25 kapsamında Handwerksrolle kaydı ve Meister veya eşdeğer yeterlilik gerekir. Leipzig, Saarland, Augsburg ve Südwestfalen Handwerkskammer'leri de aynı görüşte. ⚠️ Bu bilgi, test sektöründe çalışan iki şirketin bloglarından; mahkeme kararının kendisi okunmadı.

| İş | Gereken | Kaynak |
| --- | --- | --- |
| DGUV V3 testi (taşınabilir ve sabit cihaz, tesis, makine), VDE 0701/0702, VDE 0100/0105 | Handwerksrolle (Elektrotechniker) + Meister veya §7b/§8 yolu veya Meister'li Betriebsleiter. Testi yapan kişi Elektrofachkraft olmalı (DIN VDE 1000-10) | ⚠️ VG Halle 2022, HWK görüşleri |
| Wallbox kurulumu, değişikliği | Sadece dağıtım şirketinin (Netzbetreiber) yetkili firma listesine (Installateurverzeichnis) kayıtlı firma yapabilir (§§13, 19 NAV). Devreye almadan önce bildirim; 12 kVA (≈ 11 kW) üstü onay gerekir, cevap süresi en fazla 2 ay | ✅ Bundesnetzagentur |
| Installateurverzeichnis'e kayıt | Handwerksrolle kaydı (gerekiyorsa) + en az bir "sorumlu Elektrofachkraft": Meister veya "Sachkundenachweis für den Anschluss elektrischer Anlagen an das Niederspannungsnetz" + tanımlı ölçüm cihazları (izolasyon, RCD, çevrim empedansı vb.) | ✅ BDEW/ZVEH Grundsätze 2024 |

**Rapor davranışı:** elektrik testi veya kurulum fikrinde "Lokal uygulanabilirlik" otomatik kırmızı bayrak alır; kullanıcı Meister değilse dört yol listelenir: Meister sınavı, §7b (Geselle + 6 yıl, 4'ü yönetici), §8 istisna izni (özellikle yabancı diploma ile), Meister'li Betriebsleiter istihdamı. Wallbox ayrıca Installateurverzeichnis adımı olarak gösterilir. Kesin karar her zaman yerel Handwerkskammer'e bırakılır.

**AB dışı mühendis diploması (DGUV V3 vakasından, 15.10.2026):** §7 Abs. 2 HwO, mühendisleri Meister'e gerek olmadan Handwerksrolle'ye kaydeder; ama yabancı diplomalardan sadece AB, AEA ve İsviçre diplomalarını Alman diplomasına eşit sayar ✅ (§7 Abs. 2 Satz 4–5 HwO). Türkiye'den alınmış bir elektrik mühendisliği diploması bu otomatik kapsama girmez: Handwerkskammer'de denklik tespiti (Gleichwertigkeitsfeststellung, BQFG) veya §8 istisna izni gerekir ⚠️ süre ve belge listesi HWK'dan doğrulanacak.

**Rapor davranışı:** form diplomanın ülkesini sorar. AB dışı diplomada "mühendis diploman muhtemelen yeterli" denmez; denklik adımı, tahmini süresi (haftalar–aylar) ve bu sürenin Gründungszuschuss son tarihiyle çakışıp çakışmadığı gösterilir.

**Tamamlayıcı hizmet: dışarıdan iş güvenliği uzmanlığı (externe Fachkraft für Arbeitssicherheit, DGUV Vorschrift 2).** DGUV V3 testi alan firmaların çoğu iş güvenliği uzmanı bulundurmak zorunda; bu hizmet yıllık sözleşmeyle tekrarlanan gelir getirir ve 4 yılda bir tekrarlanan makine testlerinin dalgalanmasını dengeler. Atanma şartı: mühendis unvanı veya mühendislik lisansı + bu meslekte en az 2 yıl deneyim + tanınmış Sifa eğitimini bitirmiş olmak ✅ (WHZ Zwickau, Bestellungsvoraussetzungen). Yabancı diploma için açık kural bulunamadı; eşdeğerliği kaza sigortası kurumu (Berufsgenossenschaft) vaka bazında değerlendirir ⚠️.

**Rapor davranışı:** kurucunun sertifikaları veya devam eden eğitimleri arasında Sifa, Schaltberechtigung, şarj istasyonu (HPC) eğitimi gibi nitelikler varsa motor bunları "ek gelir kolu" olarak değerlendirir ve finans tablosunda ayrı satır açar. Form bu yüzden "sertifikalar ve devam eden eğitimler" alanını ayrı sorar.

## 5. İzne tabi işler

Gewerbeanmeldung çoğu iş için yeterli; aşağıdaki işler ek izin veya kayıt ister. Liste IHK Frankfurt'tan ✅ (Hessen yetkili makamları ile); burada kitlemizi ilgilendirenler, tam liste kural tabanı JSON'unda.

| İş | Dayanak | Yetkili (Hessen) | Tipik şart |
| --- | --- | --- | --- |
| Restoran / imbiss, alkol servisli | §14 GewO + §3 HGastG | Gewerbeamt | 2012'den beri izin yok, **açılıştan en geç 6 hafta önce bildirim**; ayrıca Gesundheitszeugnis/Infektionsschutz-Belehrung, Lebensmittelüberwachung, Bauamt (Nützungsänderung) ⚠️ |
| Emlak komisyoncusu, Wohnimmobilienverwalter | §34c GewO | Gewerbeaufsicht (Kreis/Stadt) | Güvenilirlik, düzenli mali durum; yönetici için sigorta + eğitim |
| Finanzanlagenvermittler | §34f GewO | IHK | Sachkundeprüfung, sigorta, register |
| Sigorta aracısı | §34d GewO | IHK | Sachkunde, sigorta, register |
| Kredi aracısı (konut) | §34i GewO | Gewerbeamt → IHK register | Sachkunde, sigorta |
| Güvenlik hizmeti | §34a GewO | Gewerbeaufsicht | Sachkundeprüfung (IHK), güvenilirlik |
| Seyyar satıcılık / pazar | §55 GewO (Reisegewerbekarte) | Ordnungsbehörde | Pazar yeri ayrıca belediye |
| Taşımacılık (yolcu: taksi, transfer) | §§2, 13 PBefG | Ordnungsamt / RP; IHK Sachkunde | Konzession |
| Yük taşımacılığı (> 2,5 t) | §3 GüKG | Regierungspräsidium | Lizenz, Fachkunde |
| Personel kiralama (Leiharbeit) | §§1–2 AÜG | Bundesagentur für Arbeit | Erlaubnis |
| Borç tahsili (Inkasso) | §3 RDG | Mahkeme başkanlığı | Registrierung |
| Hukuki danışmanlık | RDG | — | Lisanslı meslek; "şirket kuruluş danışmanlığı" sınırı bizim platform için de geçerli |
| Sürücü kursu | FahrlG | Regierungspräsidium | Fahrlehrerlaubnis |
| Hayvan satışı/bakımı (pet shop, pansiyon) | §11 TierSchG | Veterinäramt | Sachkunde |

**Rapor davranışı:** sektör eşleşirse ilgili satır ve yetkili makam raporun hukuki yol bölümüne eklenir; izin süresi nakit akışı simülasyonunda "gelirsiz bekleme" olarak hesaplanır.

## 6. Gründungszuschuss ve Einstiegsgeld

Gründungszuschuss bir **takdir yetkisi** (Ermessensleistung), hak değil; rapor "alabilirsin" değil, "başvuru koşullarını karşılıyorsun" der. Kaynak: IHK Merkblatt (Stand 01/2024) ve IHK Lahn-Dill ✅.

| Koşul / unsur | Değer |
| --- | --- |
| Kim | ALG I alan, en az **150 gün** kalan hakkı olan; en az 1 gün ALG I almış olmak (işten doğrudan geçiş olmaz) |
| Başvuru zamanı | Serbest çalışma **başlamadan önce** (Gewerbeanmeldung öncesi) |
| Uzman görüşü | Businessplan için fachkundige Stellungnahme (IHK, Steuerberater, banka vb.) |
| Faz 1 | 6 ay: son ALG I tutarı + aylık 300 € sosyal sigorta payı |
| Faz 2 | 9 ay daha aylık 300 € — yoğun, tam zamanlı faaliyet kanıtı ile, ayrıca takdire bağlı |
| Toplam | En fazla 15 ay |
| Tekrar | Önceki teşvikten 24 ay geçmiş olmalı |
| Vermittlungsvorrang | 01.01.2023'ten beri Gründungszuschuss için kaldırıldı |
| Tam zamanlılık | Gerekli; Nebengewerbe ile Gründungszuschuss olmaz |

**Einstiegsgeld (§16b SGB II) — Bürgergeld alanlar için:** en fazla 2 yıl, normalde Regelbedarf'ın %50'si (aile büyüklüğü ve işsizlik süresine göre %100'e kadar), tamamen takdire bağlı (Kann-Leistung). ⚠️ Kaynak sayfa "ALG II" terimini kullanıyor; Bürgergeld dönemindeki uygulama Jobcenter'dan doğrulanacak.

**Rapor davranışı:** kullanıcı "işsizim, ALG I alıyorum" derse tahmini kalan gün sorulur; ≥ 150 ise rapora Gründungszuschuss satırı eklenir, nakit akışı simülasyonu iki senaryo ile gösterilir (onaylı / reddedilmiş). Businessplan paketinin ilk ve en net satış kapısı burası.

**ALG I süresi ve son başlangıç tarihi (DGUV V3 vakasından, 15.10.2026).** Raporda kullanıcının tahmini "ALG I biter" tarihi kullanıldı; CV'deki son iş tarihi bunun 3 ay erken olabileceğini gösterdi. Gründungszuschuss'ta en pahalı hata bu: 150 gün şartı kaçarsa teşvik tamamen gider. Hak süresi §147 SGB III'e göre ✅:

| Sigortalı çalışma (son 30 ay) | Yaş | ALG I süresi |
| --- | --- | --- |
| 12 ay | — | 6 ay |
| 16 ay | — | 8 ay |
| 20 ay | — | 10 ay |
| 24 ay | — | 12 ay |
| 30 ay | 50+ | 15 ay |
| 36 ay | 55+ | 18 ay |
| 48 ay | 58+ | 24 ay |

**Rapor davranışı:** form tahmini kalan gün yerine iki şey sorar: ALG I başlangıç tarihi ve onay yazısındaki (Bewilligungsbescheid) bitiş tarihi; bitiş bilinmiyorsa yaş ve son işten çıkış tarihi. Motor son başlangıç günü = bitiş − 150 gün hesaplar ve tarihi "⚠️ Bescheid'den doğrula" notuyla verir. Son gün 8 haftadan yakınsa raporun en üstünde kırmızı uyarı çıkar. Bescheid tarihi formdan gelmediyse tarih asla kesin yazılmaz.

**AVGS kuruluş koçluğu (Gründungscoaching).** Arbeitsagentur, ALG I alan kuruculara AZAV sertifikalı bir kurumda ücretsiz bire bir koçluk verebilir (Aktivierungs- und Vermittlungsgutschein, §45 SGB III; genelde 40–60 saat; takdire bağlı) ✅ (Gründerplattform). Kupon Gewerbe kaydıyla geçersiz olur; yani koçluk kuruluştan önce başlamalı. **Rapor davranışı:** ALG I alan herkese Gründungszuschuss satırının yanında AVGS satırı ve doğru sıra gösterilir: 1) AVGS talebi, 2) iş planı ve uzman görüşü, 3) Gründungszuschuss başvurusu, 4) onaydan sonra Gewerbe kaydı.

## 7. Oturum statüsü ve serbest çalışma

TR→DE kitlesi için en kritik ve en riskli bölüm: yanlış bilgi oturum hakkını tehlikeye atabilir. Bu yüzden motor burada **hiçbir zaman "yapabilirsin" demez**; statüye göre "serbest / izin gerekli / avukata danış" üçlüsünden birini seçer. ✅ 14.10.2026: öğrenci, iş arama, Blaue Karte ve §21 Abs. 1, 3, 4, 5 make-it-in-germany.com'dan doğrulandı. ✅ §21 Abs. 2a ve 6, §4a ve §2 Abs. 2 kanun metninden (gesetze.legal) doğrulandı. 🔴 ARB 1/80 bilerek avukata yönlendirilir.

| Statü | Serbest çalışma | Motorun sınıfı |
| --- | --- | --- |
| AB/EWR/İsviçre vatandaşı | Serbest (Freizügigkeit) | Serbest |
| Niederlassungserlaubnis (§9) / Daueraufenthalt-EU (§9a) | Serbest | Serbest |
| Aile birleşimi (eş), §27 Abs. 5 | §4a Abs. 1: oturum sahibi, kanun yasaklamadıkça her türlü Erwerbstätigkeit yapabilir; bu serbest çalışmayı da kapsar (§2 Abs. 2) ✅. Kartın üzerindeki ibare belirleyici (§4a Abs. 3) | Serbest, karttaki ibareyi kontrol et |
| Öğrenci (§16b) | Yılda 140 tam / 280 yarım gün **veya dönem içinde haftada 20 saat bağımlı çalışma. Serbest çalışma için Ausländerbehörde onayı gerekir; öğrenimi geciktirip geciktirmediğine bakılır ✅** | İzin gerekli |
| Mezuniyet sonrası iş arama (§20, 18 ay) | 18 ay, uzatılamaz; bu sürede "her türlü faaliyete" izin var ✅. 18 aydan uzun sürecek bir iş için §21 oturumuna geçiş şart | Serbest (18 ay) → sonra §21'e geçiş |
| Blaue Karte EU (§18g) / Fachkraft (§18a/b) | Bağımlı iş için verildi; yan serbest faaliyet için §21 Abs. 6 kapsamında izin ⚠️ (make-it-in-germany konuya değinmiyor). Blaue Karte'de Niederlassungserlaubnis 27 ay (A1 Almanca) veya 21 ay (B1) sonra ✅. Tam zamanlı serbest çalışmaya geçişte §21 Abs. 2a kolaylaştırılmış yolu Blaue Karte sahiplerine de açık ✅ | İzin gerekli |
| Serbest çalışma oturumu (§21) | Kartın verildiği faaliyet | Serbest (o faaliyet için) |
| Turist / Schengen vizesi | Yasak | Yasak |
| Asyl / Duldung | Genelde yasak veya sınırlı | 🔴 Avukat |
| Türk vatandaşı, ARB 1/80 / Ankara Anlaşması | Stillhalteklausel (Ek Protokol md. 41): 1.1.1973'teki kurallardan daha sıkı kural uygulanamaz. Şerhe göre §21 yerine 1965 AuslG ölçütü (uyum ve gerçekçi başarı şansı) geçerli; lehte olabilir ama uygulaması tartışmalı | 🔴 Avukat |

**§21 AufenthG — serbest çalışma oturumu (yeni gelecekler ve statü değiştirenler):**

- **Abs. 1 (Gewerbe):** ekonomik ilgi veya bölgesel ihtiyaç, ekonomiye olumlu etki beklentisi, finansmanın öz sermaye veya kredi taahhüdüyle güvenceli olması. IHK/Handwerkskammer görüşü alınır.
- **Abs. 2a (Alman üniversitesi mezunları, araştırmacılar):** Abs. 1 koşulları aranmaz; izin kural olarak verilir ("soll erteilt werden"). Kapsam: Alman üniversitesi mezunları, araştırmacılar ve Blaue Karte sahipleri. Şart: faaliyet, alınan eğitimle veya araştırma alanıyla bağlantılı olmalı. MentörDE kitlesi için en önemli kapı ✅
- **Abs. 3:** 45 yaş üstü için yeterli emeklilik güvencesi şartı.
- **Abs. 4:** en fazla 3 yıl; iş başarılıysa ve geçim güvenceliyse 3 yıl sonra Niederlassungserlaubnis.
- **Abs. 5 (Freiberufler):** Abs. 1 koşullarından muaf tutulabilir; finansman ve gerekli meslek izni aranır.
- **Abs. 6:** başka amaçla oturan biri, mevcut kartı korunarak serbest çalışma izni alabilir (takdir). Şart: diğer gerekli izinlerin alınmış veya söz verilmiş olması ✅

**Rapor davranışı:** formda "oturum statünüz" zorunlu soru. "İzin gerekli" veya "avukat" çıkarsa rapor, şirket türü önerisinden **önce** bu adımı gösterir ve MentörDE danışmanlık kapısını açar. Senin Ausländerbehörde pratik bilgin bu bölümün gerçek değeri: hangi behörde ne kadar sürede, hangi belgeyle izin veriyor.

## 8. Finansman ve teşvik

Küçük kurucu için iki gerçekçi kredi kapısı var: Hessen-Mikrodarlehen (35.000 €'ya kadar) ve KfW StartGeld (daha büyük, Hausbank üzerinden). Motor, nakit akışı simülasyonundaki açığı bu programlarla eşleştirir.

| Program | Tutar | Vade | Kim | Başvuru | Durum |
| --- | --- | --- | --- | --- | --- |
| Hessen-Mikrodarlehen (WIBank) | 3.000–35.000 € | 7 yıl | Gerçek kişi ve Freiberufler; tam veya yarı zamanlı; kuruluştan sonraki 5 yıl içinde; yatırım + işletme sermayesi | Önce WIBank işbirlikçisinde danışmanlık, başvuruyu o iletir; tamamlanmış projeler finanse edilmez | ✅ (Förderdatenbank; Merkblatt 01.02.2025) |
| KfW ERP-Gründerkredit StartGeld (067) | 125.000 €'ya kadar | 5–10 yıl, ilk yıllar anapara ödemesiz | Kurucular, Nebenerwerb dahil, kuruluştan sonraki 5 yıl | Hausbank üzerinden; KfW bankaya %80 risk muafiyeti verir | ⚠️ (IHK Merkblatt erişilemedi) |
| Gründungszuschuss | ALG I + 300 € / 6 ay, sonra 300 € / 9 ay | — | ALG I alan, ≥ 150 gün hak | Arbeitsagentur (bölüm 6) | ✅ |
| Einstiegsgeld | Regelbedarf'ın %50–100'ü | ≤ 2 yıl | Bürgergeld alan | Jobcenter (bölüm 6) | ⚠️ |
| Gründercoaching / BAFA | Danışmanlık maliyetinin bir kısmı | — | Kuruluş öncesi/sonrası | Program yapısı 2023'ten beri değişti | 🔴 güncel durum araştırılacak |

**Rapor davranışı:** nakit dip noktası sermayenin altına düşerse açık ≤ 35.000 € için Mikrodarlehen, üstü için StartGeld satırı eklenir. Hessen dışındaki eyaletler için (Bayern LfA, NRW.BANK vb.) Förderdatenbank sorgusu Faz 2'de eklenecek; MVP Hessen + federal programlarla çıkar.

## Değerli maden ve yüksek değerli mal ticareti

Mücevher, altın ve değerli taş satan işler, sıradan e-ticaretin üstüne ek uyum yükü taşır. ASTRÉE vakasından eklendi. GwG satırı ✅ Bezirksregierung Münster'den doğrulandı. Diğer satırlar ⚠️ kurucunun kendi araştırmasından; resmi kaynaktan (BaFin, Zoll) doğrulanacak.

| Konu | Kural | Rapor davranışı |
| --- | --- | --- |
| Kara para (GwG) | Değerli maden (altın, gümüş, platin) satıcısında 2.000 € ve üstü NAKİT işlemde kimlik kontrolü ve risk yönetimi; diğer mallarda eşik 10.000 € nakit. Kart/online ödemede eşik yok, ama şüpheli işlem her tutarda bildirilir. goAML kaydı 2024'ten beri tüm yükümlülere zorunlu ✅. Mücevherin hangi gruba girdiği belgede net değil ⚠️ | Nakit kabul ediliyorsa 2.000 € eşiği uyarısı; her durumda goAML kaydı ve şüpheli işlem süreci notu |
| Damga (Edelmetallprüfgesetz) | Altın ürünlerde ayar damgası (585, 750 vb.) | İthal üründe damganın Alman kurallarına uygunluğu kontrolü |
| Reklam (BaFin) | "Yatırım" vurgusu izin gerektirebilir; Meta politikası da kısıtlıyor | Pazarlama dilinde yatırım vurgusu yapılmaması notu |
| KDV | Mücevher her zaman %19; yatırım altını (≥ 995/1000 saf) muaf | Kleinunternehmer uyarısı ve fiyat hesabı |
| İthalat | Gümrük mücevherde %2,5 (altın kaplama %4); ithalat KDV'si %19 indirilebilir; EORI gerekli | Maliyet tablosuna gümrük satırı |
| Nakliye | Türkiye'den altın mücevher PTT ve normal kargoyla gönderilemez; lisanslı kurye (Brinks, G4S, Loomis, Malca-Amit) | Kurye maliyeti ve teslim süresi satırı |
| Cayma hakkı | 14 gün; kişiselleştirilmiş ürün (gravur) hariç | İade oranı varsayımı |

## Sektör maliyet normları

Raporun "bu sayı sağlıklı mı" sorusuna cevap verdiği ölçüler. Normun dışına çıkan her kalem raporda uyarı olarak görünür. Oranlar net ciroya göre.

| Sektör | Kalem | Norm | Durum |
| --- | --- | --- | --- |
| Gastronomi | Mal maliyeti (Wareneinsatz) | %25–35 | ✅ g-wie-gastro |
| Gastronomi | Personel | %30–40 | ✅ g-wie-gastro |
| Gastronomi | Mal + personel toplamı | ≤ %65 (kalan pay kira, işletme gideri ve kâr için) | ✅ g-wie-gastro |
| Gastronomi | Kira | Pratikte %8–12 hedeflenir; %15 üstü risk | ⚠️ yaygın pratik kural, resmi kaynak bulunamadı |
| Perakende | Kira | ⚠️ araştırılacak | — |
| Kuaför / berber | Personel, kira | ⚠️ araştırılacak | — |
| E-ticaret (moda, takı) | İade oranı | Genel online ticarette ≈ her 4 paketten biri iade (2021) ✅; takı için ayrı veri yok ⚠️. Sıradan koli iadesinin taşıma ve işlem maliyeti ≈ 2,85 €; sigortalı kuryede çok daha yüksek | — |

**Rapor davranışı:** mekanlı her işte "kira / başabaş cirosu" zorunlu satır. Gastronomide mal + personel %65'i geçerse veya kira %15'i geçerse kırmızı uyarı: kalan pay işletme giderini ve kârı karşılamaz.

## 9. Karar ağacı

Motor önce "bu kişi bu işi yapabilir mi" sorusunu, sonra "hangi şekilde yapmalı" sorusunu cevaplar. Tersi yanlış olur: ideal Rechtsform'u öneren bir rapor, oturum izni olmayan bir öğrenciye ya da Meister'i olmayan bir berbere zarar verir.

> Akış: 1) Oturum → 2) Meisterpflicht → 3) İzne tabi iş → 4) Freiberuf/Gewerbe → 5) Rechtsform → 6) Finansman/teşvik. İlk üç adım engel kontrolüdür.

İlk üç adım engel kontrolüdür; engel bulunursa rapor durmaz, çözüm yolunu ve maliyetini not ederek devam eder. Son adım nakit akışı açığına göre teşvik ve kredi önerir.

## Kaynaklar

**Okunan ve doğrulanan (13.10.2026):**

- [Finanzamt Baden-Württemberg – Kleinunternehmerregelung](https://finanzamt-bw.fv-bwl.de/Startseite/Service/Was+ist+die+sogenannte+Kleinunternehmerregelung_) — 25.000 / 100.000 €
- [§141 AO (lexmea)](https://lexmea.de/de/gesetz/ao/141) — 800.000 / 80.000 €
- [IHK Merkblatt Gründungszuschuss, Stand 01/2024](https://www.ihk.de/blueprint/servlet/resource/blob/3950766/c7d213496bdcf4e584b3cd50041c934f/gruendungszuschuss-merkblatt-data.pdf)
- [IHK Lahn-Dill – Gründungszuschuss und Einstiegsgeld](https://www.ihk.de/lahn-dill/gruendung-foerderung-steuern/unternehmensgruendung/gruendungszuschuss-und-einstiegsgeld-4862266)
- [IHK Frankfurt – Erlaubnispflichtige Gewerbe](https://www.frankfurt-main.ihk.de/hauptnavigation/gruendung-und-foerderung/rechtsinformationen-fuer-gruender/gewerberecht-kurzinformationen/erlaubnispflichtige-gewerbe-5249696) — GewO listesi, HwO Anlage A, Hessen Gaststätte
- [IHK Frankfurt – Rechtsformen](https://www.frankfurt-main.ihk.de/hauptnavigation/gruendung-und-foerderung/rechtsinformationen-fuer-gruender/rechtsformen-gesellschaftrechtsformen) — genel yapı, rakam yok
- [HIHK Existenzgründung im Nebenerwerb (2021)](https://www.frankfurt-main.ihk.de/blueprint/servlet/resource/blob/5267564/be821aaf6dd060add9edcb74b2190652/hihk-existenzgruendung-im-nebenerwerb-data.pdf) — bazı eşikleri eskimiş
- [Förderdatenbank – Hessen-Mikrodarlehen](https://www.foerderdatenbank.de/FDB/Content/DE/Foerderprogramm/Land/Hessen/hessen-mikrodarlehen.html)

**14.10.2026 eklenenler:**

- [IHK Frankfurt – Reduzierter Mehrwertsteuersatz auf Speisen ab 1.1.2026](https://www.frankfurt-main.ihk.de/branchenthemen/portal-gastronomie-tourismus-und-gesundheitswirtschaft/wichtige-informationen-zum-gaststaettengewerbe/news-fuer-die-gastronomie/reduzierter-mehrwertsteuersatz-6847546)
- [IHK München – Merkblatt Herstellung von Nahrungsmitteln (03/2020)](https://www.ihk-muenchen.de/ihk/documents/Recht-Steuern/Abgrenzung-zum-Handwerk/Merkblatt-Herstellung_von_Nahrungsmitteln2023.pdf)
- [g-wie-gastro – Betriebsoptimierung in der Gastronomie](https://g-wie-gastro.de/unternehmensfuehrung/management/gewinn-und-kostenoptimierung/betriebsoptimierung-in-der-gastronomie) — mal ve personel normları

* [Make it in Germany – Visum zur Selbstständigkeit](https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/selbststaendigkeit) — §21 Abs. 1, 3, 4, 5
* [Make it in Germany – Studium und Arbeit](https://www.make-it-in-germany.com/de/studium-ausbildung/studieren-in-deutschland/arbeit) — 140/280 gün, 20 saat, serbest çalışma onayı
* [Make it in Germany – Perspektiven nach dem Studium](https://www.make-it-in-germany.com/de/studium-ausbildung/studieren-in-deutschland/perspektiven-danach) — 18 ay iş arama, her türlü faaliyet
* [Make it in Germany – Blaue Karte EU](https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/blaue-karte-eu) — Niederlassungserlaubnis 27/21 ay

- [gesetze.legal – §21 AufenthG](https://gesetze.legal/bund/aufenthg/21), [§4a](https://gesetze.legal/bund/aufenthg/4a), [§2](https://gesetze.legal/bund/aufenthg/2) — kanun metni
- [migrationsrecht.net – ARB 1/80, Selbständige](https://www.migrationsrecht.net/kommentar-arb1-80-assoziationsratsbeschluss-ewg-tuerkei-arb-1/80/kommentierung-selbstaendige.html) — Stillhalteklausel şerhi

* [MEBEDO – Eintragung von Prüfdienstleistern in die Handwerksrolle (2025)](https://mebedo-ac.de/blog/eintragung-von-pruefdienstleistern-in-die-handwerksrolle/) ve [E-Service-Check (2023)](https://www.e-service-check.de/eintragungspflicht-von-pruefdienstleistern-in-die-handwerksrolle/) — VG Halle 2022, HWK görüşleri (ticari kaynak)
* [Bundesnetzagentur – Wallbox FAQ](https://www.bundesnetzagentur.de/DE/Vportal/Energie/E_Mobilitaet/_faq/Wallbox_table.html) — §§13, 19 NAV
* [BDEW/ZVEH Grundsätze Installateurverzeichnis 2024](https://www.bdew.de/media/original_images/2024/02/02/240131_grundsatze_bdew_zveh_2024.pdf)

- [Bezirksregierung Münster – GwG Hinweise für Güterhändler](https://www.brms.nrw.de/system/files/media/document/file/34_gwp_hinweise_gueterhaendler_0.pdf) — 2.000 € nakit eşiği, goAML
- [Uni Bamberg – Retourenmanagement (2022)](https://www.uni-bamberg.de/presse/pressemitteilungen/artikel/erste-europaeische-haendlerbefragung-retourenmanagement/) — iade oranı ve maliyeti

**15.10.2026 eklenenler (DGUV V3 vakası):**

- [§7 HwO (anwalt24)](https://www.anwalt24.de/gesetze/hwo/7) — mühendis kaydı, sadece AB/AEA/İsviçre diplomaları eşit
- [Arbeitslosengeld I – Höhe und Dauer, §147 SGB III (nexvyra, Stand 06/2026)](https://nexvyra.de/fakten/arbeitslosengeld-1) — hak süresi tablosu
- [Gründerplattform – AVGS-Gründungscoaching](https://gruenderplattform.de/unternehmen-gruenden/avgs-gruendungscoaching)
- [Gründungszuschuss 2026 – fachkundige Stellungnahme ve belgeler](https://kostenlose-erechnung.de/ratgeber/gruendungszuschuss-2026-erste-rechnung/)
- [WHZ Zwickau – Bestellungsvoraussetzungen Sifa](https://www.whz.de/fileadmin/fakultaeten/amb/ifp/docs/Bestellungsvoraussetzungen_SIFA.pdf)

**Okunamayan, doğrulama bekleyen:**

- gesetze-im-internet.de (§18 EStG, §19 UStG, §11 GewStG, AufenthG) — otomatik okumaya kapalı; lexmea.de veya buzer.de üzerinden okunacak
- make-it-in-germany.com (§21 serbest çalışma, öğrenci kuralları) — erişim izni zaman aşımına uğradı
- existenzgruender.de, gruenderplattform.de — sayfa yüklenmedi
- KfW StartGeld Merkblatt — sunucu reddetti

**Kontrol takvimi:** Ocak (vergi eşikleri, Jahressteuergesetz), Temmuz (teşvik programları), oturum kuralları her mevzuat değişikliğinde. Her kural satırı JSON'da `source_url` ve `checked_at` alanı taşır; 12 aydan eski kontrol tarihli kural raporda "güncelliği doğrulanmalı" notuyla gösterilir.
