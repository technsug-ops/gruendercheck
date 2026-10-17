// Almanya kural tabanının (docs/kb/ALMANYA-KURAL-TABANI.md) kodla uygulanan kısmı: karar tabloları.
// Her kural kaynağını (kb: bölüm) ve doğrulama durumunu (✅ resmi kaynak · ⚠️ doğrulanmalı · 🔴 uzman şart) taşır.
// Metin değişirse önce kural tabanı (claude.ai projesi) değişir, sonra burası. Metinler modele gider (iç dil: Türkçe).

export type Status = "✅" | "⚠️" | "🔴";
export const KB_RULES_CHECKED = "2026-10-15";

/** Oturum durumu → serbest çalışma sınıfı (bölüm 7). Form kodu → sınıf. */
export const RESIDENCE: Record<string, { cls: "serbest" | "izin gerekli" | "avukat" | "yeni oturum gerekli"; text: string; status: Status }> = {
  de_eu: { cls: "serbest", text: "AB/EWR/İsviçre vatandaşı: serbest çalışma serbest (Freizügigkeit).", status: "✅" },
  settlement: { cls: "serbest", text: "Niederlassungserlaubnis (§9) / Daueraufenthalt-EU (§9a): serbest çalışma serbest.", status: "✅" },
  family: { cls: "serbest", text: "Aile birleşimi (§27 Abs. 5, §4a Abs. 1): kanun yasaklamadıkça serbest çalışma dahil her iş serbest; kartın üzerindeki ibare belirleyici (§4a Abs. 3).", status: "✅" },
  student: { cls: "izin gerekli", text: "Öğrenci oturumu (§16b): serbest çalışma için Ausländerbehörde onayı şart; öğrenimi geciktirip geciktirmediğine bakılır. Bağımlı çalışma sınırı: yılda 140 tam / 280 yarım gün veya dönemde haftada 20 saat.", status: "✅" },
  job_search: { cls: "serbest", text: "Mezuniyet sonrası iş arama (§20): 18 ay, uzatılamaz; bu sürede her türlü faaliyet serbest. 18 aydan uzun sürecek iş için §21 oturumuna geçiş şart (Alman üniversitesi mezunu: §21 Abs. 2a kolaylaştırılmış yol, eğitimle bağlantılı faaliyet).", status: "✅" },
  blue_card: { cls: "izin gerekli", text: "Blaue Karte / Fachkraft: yan serbest faaliyet için §21 Abs. 6 izni gerekir ⚠️; tam zamanlı serbest çalışmaya geçişte §21 Abs. 2a yolu açık. Niederlassungserlaubnis 27 ay (A1) / 21 ay (B1) sonra.", status: "⚠️" },
  other: { cls: "avukat", text: "Oturum durumu belirsiz (\"Diğer\"): serbest çalışma hakkı ancak karttaki ibare ve oturum türüyle değerlendirilebilir; Ausländerbehörde veya göç hukuku avukatı.", status: "🔴" },
  abroad: { cls: "yeni oturum gerekli", text: "Henüz Almanya'da değil: serbest çalışma için §21 oturumu gerekir (Abs. 1: ekonomik ilgi, finansman güvencesi, IHK/HWK görüşü; Abs. 5 Freiberufler; 45 yaş üstü emeklilik güvencesi Abs. 3).", status: "✅" },
};
export const TURKISH_CITIZEN_NOTE = "Türk vatandaşıysa: ARB 1/80 / Ankara Anlaşması Stillhalteklausel'i daha lehte olabilir ama uygulaması tartışmalı → göç hukuku avukatı.";

export interface KeywordRule { id: string; re: RegExp; text: string; status: Status; kb: string }

/** HwO Anlage A meslekleri (bölüm 4): Meister veya eşdeğeri olmadan Handwerksrolle kaydı olmaz. */
export const MEISTER_A: KeywordRule[] = [
  { id: "friseur", re: /fris(eu|ö)r|barbi?er|berber|kuaf(ö|o)r|haarschnitt|saç kes/i, text: "Friseur (Anlage A Nr. 38)", status: "✅", kb: "4" },
  { id: "baecker", re: /bäcker|backwaren|brötchen|\bfırın|ekmek|simit|börek|poğaça/i, text: "Bäcker (Anlage A Nr. 30) — kafede servis gastronomi, fırın gibi satış el sanatı", status: "✅", kb: "4" },
  { id: "konditor", re: /konditor|torte|pastane|yaş pasta|baklava|künefe üret|tatlı (üret|imalat)|patisserie/i, text: "Konditor (Anlage A Nr. 31) — ağırlık pasta/tatlı satışındaysa", status: "✅", kb: "4" },
  { id: "fleischer", re: /fleischer|metzger|kasap|sucuk|wurst|döner ?(şiş|spieß)|dönerspieß/i, text: "Fleischer (Anlage A Nr. 32) — et porsiyonlama, açık sucuk; döner şişi üretimi vaka bazlı 🔴", status: "✅", kb: "4" },
  { id: "kfz", re: /\bkfz|autowerkstatt|auto-?reparatur|oto (tamir|servis|bakım)|araba tamir|reifenservice|reifenwechsel|lastikçi|lastik değiş/i, text: "Kfz-Techniker (Anlage A Nr. 20)", status: "✅", kb: "4" },
  { id: "elektro", re: /elektriker|elektroinstallation|elektrotechni|elektrik (tesisat|işleri|ustası|montaj|arıza)|dguv|\bvde\b|e-check|wallbox|ladestation|şarj istasyonu (kurulum|montaj)|photovoltaik|solaranlage|güneş paneli (kurulum|montaj)/i, text: "Elektrotechniker (Anlage A Nr. 25) — sadece test yapan firma da dahil (VG Halle 2022 ⚠️); Wallbox için ayrıca Netzbetreiber Installateurverzeichnis", status: "⚠️", kb: "4" },
  { id: "installateur", re: /sanitär|heizung|installateur|tesisat|kombi\b|wärmepumpe|klimaanlage|klima montaj/i, text: "Installateur/Heizungsbauer (Anlage A Nr. 24)", status: "✅", kb: "4" },
  { id: "maler", re: /\bmaler\b|lackierer|boyacı|boya badana|badana/i, text: "Maler/Lackierer (Anlage A Nr. 10)", status: "✅", kb: "4" },
  { id: "fliesen", re: /fliesen|fayans|seramik döşe/i, text: "Fliesenleger (Anlage A Nr. 42)", status: "✅", kb: "4" },
  { id: "tischler", re: /tischler|schreiner|marangoz|mobilya imal/i, text: "Tischler (Anlage A Nr. 27)", status: "✅", kb: "4" },
  { id: "glaser", re: /\bglaser|cam ustası|cam montaj/i, text: "Glaser (Anlage A Nr. 39)", status: "✅", kb: "4" },
];
export const MEISTER_PATHS = "Meister olmadan yollar: §7b Ausübungsberechtigung (Geselle + 6 yıl, 4'ü yönetici; bazı sağlık meslekleri hariç) · §8 Ausnahmebewilligung (yabancı diploma, uzun deneyim; HWK takdiri) · Meister'li Betriebsleiter istihdamı (maliyet!) · yabancı belge için BQFG denklik 🔴 HWK. AB dışı mühendis diploması §7 Abs. 2'deki otomatik kapsama girmez → denklik veya §8.";

/** Sadece Handwerkskammer'e bildirim (Anlage B1/B2). */
export const HANDWERK_B: KeywordRule[] = [
  { id: "kosmetik", re: /kosmeti|nagel|tırnak|güzellik salon|wimpern|kirpik/i, text: "Kosmetiker / Nagelstudio (Anlage B1/B2: sadece bildirim)", status: "⚠️", kb: "4" },
  { id: "schuh", re: /schuhmacher|ayakkabı tamir/i, text: "Schuhmacher (B1)", status: "⚠️", kb: "4" },
  { id: "uhr", re: /uhrmacher|saat tamir/i, text: "Uhrmacher (B1)", status: "⚠️", kb: "4" },
  { id: "gold", re: /goldschmied|kuyumcu/i, text: "Goldschmied (B1)", status: "⚠️", kb: "4" },
  { id: "foto", re: /fotograf|fotoğraf/i, text: "Fotograf (B1)", status: "⚠️", kb: "4" },
  { id: "schneider", re: /änderungsschneider|schneiderei|\bterzi/i, text: "Änderungsschneiderei (B2)", status: "⚠️", kb: "4" },
  { id: "boden", re: /bodenleger|parke|laminat döşe/i, text: "Bodenleger (B2)", status: "⚠️", kb: "4" },
];

export const GASTRO = /restaurant|restoran|caf(é|e)\b|kafe|imbiss|döner|lokanta|bistro|\bbar\b|kneipe|catering|food ?truck|pizzeria|kahvaltı|frühstück|çay ocağı|teehaus/i;
export const ALCOHOL = /alkohol|alkol|\bbier|bira|wein\b|şarap|cocktail|kokteyl|\bbar\b|kneipe|meyhane/i;
export const PRODUCTION_FOOD = /üret|herstell|backen|pişir|eigene (torten|kuchen|backwaren)|kendi (pasta|ekmek|börek)/i;

/** İzne tabi işler (bölüm 5, Hessen makamlarıyla). */
export const PERMITS: KeywordRule[] = [
  { id: "gaststaette", re: ALCOHOL, text: "Alkollü servis: §14 GewO + §3 HGastG (Hessen) — izin yok, açılıştan en geç 6 hafta önce Gewerbeamt'a bildirim; ayrıca Infektionsschutz-Belehrung, Lebensmittelüberwachung, Bauamt (Nutzungsänderung) ⚠️", status: "⚠️", kb: "5" },
  { id: "makler", re: /makler|immobilien|emlak|hausverwalt|mülk yönet/i, text: "Emlak komisyonculuğu / Wohnimmobilienverwalter: §34c GewO (Gewerbeaufsicht)", status: "✅", kb: "5" },
  { id: "finanz", re: /finanzanlage|yatırım danışman|anlageberat/i, text: "Finanzanlagenvermittler: §34f GewO (IHK, Sachkundeprüfung, sigorta, register)", status: "✅", kb: "5" },
  { id: "versicherung", re: /versicherungs(makler|vermitt)|sigorta (aracı|acente)/i, text: "Sigorta aracısı: §34d GewO (IHK)", status: "✅", kb: "5" },
  { id: "kredit", re: /kreditvermitt|immobiliardarlehen|kredi aracı/i, text: "Kredi aracılığı (konut): §34i GewO", status: "✅", kb: "5" },
  { id: "bewachung", re: /sicherheitsdienst|bewachung|güvenlik (hizmet|şirket|görevli)/i, text: "Güvenlik hizmeti: §34a GewO (IHK Sachkundeprüfung)", status: "✅", kb: "5" },
  { id: "reise", re: /wochenmarkt|markt ?stand|seyyar|pazar ?yeri|reisegewerbe/i, text: "Seyyar satış / pazar: §55 GewO Reisegewerbekarte (Ordnungsbehörde) + pazar yeri izni", status: "✅", kb: "5" },
  { id: "personen", re: /taxi|taksi|flughafentransfer|havalimanı transfer|transfer hizmeti|personenbeförderung|yolcu taşı|chauffeur/i, text: "Yolcu taşımacılığı: §§2, 13 PBefG Konzession (Ordnungsamt/RP, IHK Sachkunde)", status: "✅", kb: "5" },
  { id: "gueter", re: /umzug|nakliye|güterverkehr|\blkw|kamyon|spedition/i, text: "Yük taşımacılığı (> 2,5 t): §3 GüKG lisans (Regierungspräsidium)", status: "✅", kb: "5" },
  { id: "auev", re: /leiharbeit|personalvermittlung|zeitarbeit|personel kirala/i, text: "Personel kiralama: §§1–2 AÜG Erlaubnis (Bundesagentur für Arbeit)", status: "✅", kb: "5" },
  { id: "inkasso", re: /inkasso|forderungseinzug|alacak tahsil/i, text: "Inkasso: §3 RDG Registrierung", status: "✅", kb: "5" },
  { id: "recht", re: /rechtsberatung|hukuki danışman|vize danışman|aufenthalts(beratung|recht)|göç danışman/i, text: "Hukuki danışmanlık RDG kapsamında lisanslı meslek — sınırlar avukata sorulmalı", status: "🔴", kb: "5" },
  { id: "fahrschule", re: /fahrschule|sürücü kursu|ehliyet kursu/i, text: "Sürücü kursu: FahrlG Fahrlehrerlaubnis (Regierungspräsidium)", status: "✅", kb: "5" },
  { id: "tiere", re: /tierhandlung|zoohandlung|pet ?shop|tierpension|hayvan (bakım|otel|pansiyon)|köpek (bakım|otel)/i, text: "Hayvan satışı/bakımı: §11 TierSchG (Veterinäramt, Sachkunde)", status: "✅", kb: "5" },
  { id: "edelmetall", re: /\bgold|altın (takı|mücevher|alım|satış|bilezik|ticaret)|kuyumcu|\bsilber|gümüş takı|\bschmuck|mücevher|(?<!\p{L})takı(lar)?(?!\p{L})|juwel|edelstein/iu, text: "Değerli maden/mücevher: GwG (değerli madende 2.000 € üzeri NAKİT işlemde kimlik ve risk yönetimi; goAML kaydı herkese zorunlu ✅), ayar damgası, BaFin 'yatırım' reklamı, gümrük %2,5, lisanslı kurye ⚠️", status: "⚠️", kb: "Değerli maden" },
];

/** Freiberuf / Gewerbe ipuçları (bölüm 1). Kesin hüküm yok: Finanzamt Fragebogen belirleyici. */
export const FREIBERUF: KeywordRule[] = [
  { id: "lehre", re: /nachhilfe|unterricht|sprachkurs|\bkurs\b|kurslar|\bders\b|dersler|özel ders|dil kursu|eğitim veriyor|seminer|workshop/i, text: "Öğretim → muhtemelen Freiberuf (§18 EStG); kurs merkezi + materyal satışı karma risk (Abfärbetheorie)", status: "⚠️", kb: "1" },
  { id: "uebersetzung", re: /übersetz|dolmetsch|çeviri|tercüm/i, text: "Çeviri/tercümanlık → Freiberuf (katalog); yeminli tercümanlık ayrıca mahkeme ataması", status: "⚠️", kb: "1" },
  { id: "kreativ", re: /grafik|design|tasarım|video|content|içerik üret|texter|yazar\b|illustr/i, text: "Grafik/fotoğraf/içerik → genelde Freiberuf (sanatsal/gazetecilik); reklam amaçlı üretim sınırda", status: "⚠️", kb: "1" },
  { id: "software", re: /software|yazılım|programmier|app[- ]?entwickl|uygulama geliştir|web ?(sitesi|entwicklung)/i, text: "Yazılım geliştirme → vaka bazlı (diploma veya eşdeğer + mühendislik niteliği → Freiberuf, aksi Gewerbe)", status: "⚠️", kb: "1" },
  { id: "beratung", re: /beratung|danışman|consulting|coaching/i, text: "İşletme/pazarlama danışmanlığı → genelde Gewerbe (\"beratender Betriebswirt\" ancak işletme diploması veya eşdeğeriyle)", status: "⚠️", kb: "1" },
  { id: "vermittlung", re: /vermittl|aracılık|komisyon|agentur|ajans|başvuru (aracı|hizmet)|üniversite danışman/i, text: "Aracılık/komisyon geliri → Gewerbe", status: "⚠️", kb: "1" },
];

/** Hessen şehirleri (bölüm 5 ve 8 Hessen'e göre yazılı). Eşleşme yoksa eyalet kuralları kural tabanında yok. */
export const HESSEN = /frankfurt|wiesbaden|kassel|darmstadt|offenbach|hanau|gießen|giessen|marburg|fulda|rüsselsheim|bad homburg|oberursel|wetzlar|rodgau|dreieich|bensheim|hofheim|maintal|langen|neu-isenburg|limburg|friedberg|bad vilbel|eschborn|kronberg|königstein|bad soden|taunusstein|dietzenbach|mörfelden|viernheim|lampertheim|baunatal|bad nauheim|hessen|main-taunus|hochtaunus|wetterau/i;
export const HEBESATZ: [RegExp, string, number][] = [[/frankfurt/i, "Frankfurt am Main", 460]];

export const NUM = {
  kleinunternehmerPrev: 25_000, kleinunternehmerCur: 100_000, gewstFreibetrag: 24_500,
  mikrodarlehenMax: 35_000, startgeldMax: 125_000, gzMinDays: 150, algNebenHours: 15, algNebenFree: 165,
};
