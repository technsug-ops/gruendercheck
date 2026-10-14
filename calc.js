// Gründungs-Check hesap motoru. Deterministik: aynı girdi her zaman aynı sonucu verir.
// Raporu yazan dil modeli bu sayıları yeniden hesaplamaz, yalnızca yorumlar.

export const VAT_OPTIONS = {
  std19:   { label: 'KDV %19 (genel)', factor: 1 / 1.19 },
  red7:    { label: 'KDV %7 (gıda perakende, kitap)', factor: 1 / 1.07 },
  cafe:    { label: 'Kafe karışımı (≈ %50 içecek %19, %50 yiyecek %7)', factor: 0.5 / 1.19 + 0.5 / 1.07 },
  resto:   { label: 'Restoran karışımı (≈ %30 içecek, %70 yiyecek)', factor: 0.3 / 1.19 + 0.7 / 1.07 },
  none:    { label: 'KDV yok (Kleinunternehmer veya muaf)', factor: 1 },
};

// Sermaye aralığının alt ve üst sınırı (€)
const CAPITAL = { '0-5k': [0, 5000], '5-15k': [5000, 15000], '15-50k': [15000, 50000], '50k+': [50000, null] };

const DEFAULT_PERSONAL_NEED = 2000;   // € / ay, formda boşsa
const RAMP = [0.30, 0.45, 0.60, 0.75, 0.90]; // başabaşın yüzdesi, ay ay; 6. ayda ≥ %100
const OPEN_DAYS = { location: 26, default: 22 };
const RENT_WARN = 0.15, RENT_TARGET = 0.10;
const SUB_LIFETIME_MONTHS = 12; // abonelikte müşteri ömrü varsayımı (CAC tavanı için)
export const REV_MODELS = { one_time: 'tek seferlik satış', subscription: 'aylık abonelik', project: 'proje bazlı', commission: 'komisyon/aracılık' };

const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function suggestVat(sub) {
  if (sub.price_is_net === true || sub.price_is_net === 'true') return 'none';
  return 'std19';
}

/**
 * @param {object} sub   form cevabı
 * @param {string} vatKey VAT_OPTIONS anahtarı; fiyat net girildiyse 'none' kullan
 * @returns {{ok:boolean, missing:string[], assumptions:string[], warnings:string[], values:object}}
 */
export function calculate(sub, vatKey = suggestVat(sub)) {
  const assumptions = [], warnings = [], missing = [];
  const vat = VAT_OPTIONS[vatKey] || VAT_OPTIONS.std19;
  const isNet = sub.price_is_net === true || sub.price_is_net === 'true';

  const model = REV_MODELS[sub.rev_model] ? sub.rev_model : 'one_time';
  let priceGross = num(sub.price);
  if (priceGross === null && num(sub.competitor_price) !== null) {
    priceGross = num(sub.competitor_price);
    assumptions.push(`Kullanıcı kendi fiyatını bilmiyor; rakip fiyatı (${fmt(priceGross)} €) fiyat olarak alındı.`);
  }
  const unitCost = num(sub.unit_cost);
  const fixedBiz = num(sub.fixed_costs);
  const rent = num(sub.rent);
  const investment = num(sub.investment) ?? 0;
  let personal = num(sub.personal_need);
  if (personal === null) { personal = DEFAULT_PERSONAL_NEED; assumptions.push(`Kurucunun aylık kişisel ihtiyacı ${fmt(DEFAULT_PERSONAL_NEED)} € varsayıldı (soru 15 boş).`); }
  if (num(sub.investment) === null) assumptions.push('Kuruluş yatırımı girilmedi, 0 € alındı.');

  if (priceGross === null) missing.push(sub.price_unknown === true || sub.price_unknown === 'true' ? 'fiyat (kullanıcı henüz bilmiyor, rakip fiyatı da yok)' : 'ortalama fiyat');
  if (unitCost === null) missing.push('satış başına malzeme maliyeti');
  if (fixedBiz === null) missing.push('aylık sabit gider');
  if (missing.length) return { ok: false, missing, assumptions, warnings, values: {} };

  const netPrice = isNet ? priceGross : priceGross * vat.factor;
  if (!isNet && vatKey !== 'none') assumptions.push(`Brüt fiyat nete çevrildi: ${vat.label}.`);
  const contribution = netPrice - unitCost;
  const monthlyFixed = fixedBiz + personal;
  const openDays = sub.business_type === 'location' ? OPEN_DAYS.location : OPEN_DAYS.default;

  const values = {
    model, price_gross: priceGross, price_net: netPrice, price_is_net: isNet, unit_cost: unitCost, contribution,
    contribution_margin: netPrice > 0 ? contribution / netPrice : null,
    fixed_business: fixedBiz, personal_need: personal, monthly_fixed: monthlyFixed, open_days: openDays,
  };

  if (contribution <= 0) {
    warnings.push('Satış başına katkı payı sıfır veya negatif: her satış zarar ediyor. Fiyat veya maliyet yanlış girilmiş olabilir.');
    return { ok: true, missing, assumptions, warnings, values };
  }

  const be = (fixed, contr) => fixed / contr;
  values.breakeven_units_month = be(monthlyFixed, contribution);
  values.breakeven_units_day = values.breakeven_units_month / openDays;
  values.breakeven_revenue_net = values.breakeven_units_month * netPrice;

  // Duyarlılık
  const contrLow = netPrice * 0.9 - unitCost;
  values.be_price_minus10 = contrLow > 0 ? be(monthlyFixed, contrLow) : null;
  values.be_fixed_plus20 = be(monthlyFixed * 1.2, contribution);
  if (contrLow <= 0) warnings.push('Fiyat %10 düşerse katkı payı sıfırın altına iniyor.');

  // Kira / ciro
  if (rent !== null) {
    values.rent = rent;
    values.rent_ratio = rent / values.breakeven_revenue_net;
    values.revenue_for_rent_target = rent / RENT_TARGET;
    values.units_day_for_rent_target = values.revenue_for_rent_target / netPrice / openDays;
    if (values.rent_ratio > RENT_WARN) warnings.push(`Kiranın başabaş cirosuna oranı %${pct(values.rent_ratio)} (gastronomide %8–12 hedeflenir, %15 üstü risk).`);
  } else if (sub.business_type === 'location') {
    assumptions.push('Mekanlı iş ama kira ayrıca girilmemiş; kira/ciro oranı hesaplanamadı.');
  }

  // Nakit dip noktası: kuruluş yatırımı + rampa döneminde biriken aylık açık
  let rampDeficit = 0;
  values.ramp = RAMP.map((share, i) => {
    const units = values.breakeven_units_month * share;
    const deficit = Math.max(0, monthlyFixed - units * contribution);
    rampDeficit += deficit;
    return { month: i + 1, share, units, deficit };
  });
  values.ramp_deficit = rampDeficit;
  values.cash_trough = investment + rampDeficit;
  assumptions.push('Rampa: 1. ay başabaşın %30\'u, her ay +15 puan; 6. ayda başabaş. Depozito ve ilk stok kuruluş yatırımına dahil sayıldı.');

  const cap = CAPITAL[sub.capital];
  if (cap) {
    values.capital_low = cap[0]; values.capital_high = cap[1];
    values.gap_worst = values.cash_trough - cap[0];
    values.gap_best = cap[1] === null ? null : values.cash_trough - cap[1];
    if (values.gap_worst > 0) warnings.push(`Sermaye açığı olabilir: nakit ihtiyacı ≈ ${fmt(values.cash_trough)} €, beyan edilen sermaye ${capitalLabel(cap)}.`);
  }

  // Katlanılabilecek en yüksek müşteri edinme maliyeti
  if (model === 'subscription') {
    values.max_cac = contribution * SUB_LIFETIME_MONTHS;
    assumptions.push(`Abonelik: "satış" = aktif abone, fiyat = aylık ücret. Başabaş, gereken aktif abone sayısıdır. CAC tavanı ${SUB_LIFETIME_MONTHS} aylık müşteri ömrü varsayımıyla hesaplandı.`);
  } else if (sub.business_type === 'online_products' || sub.business_type === 'online_service') {
    values.max_cac = contribution;
    assumptions.push('Katlanılabilir CAC iade kaybı düşülmeden hesaplandı; iade oranı sektöre göre ayrıca düşülmeli.');
  }
  if (model === 'commission') assumptions.push('Komisyon modeli: fiyat = aracılık başına ortalama komisyon; malzeme maliyeti aracılık başına gider.');
  if (model === 'project') assumptions.push('Proje modeli: fiyat ortalama proje büyüklüğü; projeler arası fark büyükse aralık kullanılmalı.');

  if (num(sub.delivery_days) !== null) values.delivery_days = num(sub.delivery_days);
  return { ok: true, missing, assumptions, warnings, values };
}

export function fmt(n, digits = 0) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  if (digits === 0 && Math.abs(n) > 0 && Math.abs(n) < 10) digits = 1;
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
const pct = (r) => Math.round(r * 100);
function capitalText(v) {
  if (v.gap_worst <= 0) return `Sermaye yeterli: beyan edilen aralığın alt ucunda bile ≈ ${fmt(-v.gap_worst)} € pay kalıyor`;
  if (v.gap_best !== null && v.gap_best > 0) return `Sermaye açığı: ${fmt(v.gap_best)}–${fmt(v.gap_worst)} € (beyan edilen aralığın üst ve alt ucuna göre)`;
  if (v.gap_best !== null) return `Sermaye sınırda: aralığın alt ucunda ${fmt(v.gap_worst)} € açık, üst ucunda yeterli — gerçek tutar sorulmalı`;
  return `Sermaye açığı: en kötü durumda ${fmt(v.gap_worst)} € (50.000 €+ beyan edildi, üst sınır bilinmiyor)`;
}
const capitalLabel = ([lo, hi]) => (hi === null ? `${fmt(lo)} €+` : `${fmt(lo)}–${fmt(hi)} €`);

/** Raporu yazan modele verilecek düz metin blok. */
export function toText(res) {
  if (!res.ok) return `HESAPLAR: yapılamadı, eksik girdi: ${res.missing.join(', ')}. Sayıları sektör varsayımıyla kendin tahmin et ve "(varsayım)" diye işaretle.`;
  const v = res.values, L = [];
  L.push('HESAPLAR (kodla hesaplandı — yeniden hesaplama, sadece yorumla ve rapora aktar)');
  L.push(`- Gelir modeli: ${REV_MODELS[v.model]}`);
  L.push(v.price_is_net ? `- Fiyat: net ${fmt(v.price_net, 2)} € (kullanıcı net girdi)` : `- Fiyat: brüt ${fmt(v.price_gross, 2)} € → net ${fmt(v.price_net, 2)} €`);
  L.push(`- Satış başına malzeme: ${fmt(v.unit_cost, 2)} € → katkı payı ${fmt(v.contribution, 2)} € (%${v.contribution_margin != null ? pct(v.contribution_margin) : '–'})`);
  L.push(`- Aylık sabit gider: ${fmt(v.fixed_business)} € işletme + ${fmt(v.personal_need)} € kurucu = ${fmt(v.monthly_fixed)} €`);
  if (v.breakeven_units_month != null) {
    if (v.model === 'subscription') L.push(`- Başabaş: ${fmt(v.breakeven_units_month)} aktif abone; net ciro ${fmt(v.breakeven_revenue_net)} €/ay`);
    else L.push(`- Başabaş: ayda ${fmt(v.breakeven_units_month)} satış = günde ${fmt(v.breakeven_units_day, 1)} (${v.open_days} açık gün); net ciro ${fmt(v.breakeven_revenue_net)} €/ay`);
    const u = v.model === 'subscription' ? 'aktif abone' : 'satış/ay';
    L.push(`- Duyarlılık: fiyat −%10 → ${v.be_price_minus10 != null ? fmt(v.be_price_minus10) : '∞'} ${u}; sabit gider +%20 → ${fmt(v.be_fixed_plus20)} ${u}`);
    if (v.rent_ratio != null) L.push(`- Kira ${fmt(v.rent)} €; başabaş cirosuna oranı %${pct(v.rent_ratio)}. Oranı %10'a indirmek için ayda ${fmt(v.revenue_for_rent_target)} € net ciro, günde ${fmt(v.units_day_for_rent_target)} satış gerekir`);
    L.push(`- Nakit dip noktası: ${fmt(v.cash_trough)} € (kuruluş ${fmt(v.cash_trough - v.ramp_deficit)} € + ilk 5 ay açığı ${fmt(v.ramp_deficit)} €)`);
    if (v.capital_low != null) L.push(`- ${capitalText(v)}`);
    if (v.max_cac != null) L.push(v.model === 'subscription'
      ? `- Katlanılabilir en yüksek müşteri edinme maliyeti (${SUB_LIFETIME_MONTHS} ay ömür varsayımı): ${fmt(v.max_cac)} €`
      : `- Katlanılabilir en yüksek müşteri edinme maliyeti (iade hariç): ${fmt(v.max_cac)} €`);
  }
  if (v.delivery_days != null) L.push(`- Beyan edilen teslim süresi: ${fmt(v.delivery_days)} gün`);
  if (res.warnings.length) { L.push('UYARILAR:'); res.warnings.forEach(w => L.push(`- ${w}`)); }
  if (res.assumptions.length) { L.push('VARSAYIMLAR (raporda belirt):'); res.assumptions.forEach(a => L.push(`- ${a}`)); }
  return L.join('\n');
}
