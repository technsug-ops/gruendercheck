// Gründungs-Check — Businessplan-Finanzteil. Deterministisch, 36 Monate.
// Girdi: denetim formu (sub) + plan formu (p). Çıktı: Kapitalbedarf, Finanzierung,
// Rentabilität (3 yıl), Liquidität (36 ay), göstergeler. Metin bölümlerini Claude yazar;
// bu sayıları yeniden hesaplamaz.
import { VAT_OPTIONS, suggestVat, fmt } from './calc.js';

export const PLAN_ASSUMPTIONS = {
  employer_share: 0.21,     // işveren sosyal sigorta payı (brüt maaş üstüne)
  depreciation_years: 5,    // tüm demirbaş için ortalama faydalı ömür
  reserve_months: 2,        // likidite rezervi: aylık sabit çıkışın katı
  gz_bonus: 300,            // Gründungszuschuss faz 1 sosyal sigorta payı
  gz_months: 6,
};

const n = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const x = Number(String(v).replace(',', '.'));
  return Number.isFinite(x) && x >= 0 ? x : null;
};
const z = (v) => n(v) ?? 0;
const sum = (a) => a.reduce((s, x) => s + x, 0);

export const INV_KEYS = [
  ['inv_equipment', 'Einrichtung, Ausstattung, Maschinen', true],
  ['inv_vehicle', 'Fahrzeug', true],
  ['inv_renovation', 'Umbau, Renovierung', true],
  ['inv_it', 'IT, Software, Website', true],
  ['inv_deposit', 'Mietkaution', false],
  ['inv_stock', 'Erstausstattung Waren / Material', false],
  ['inv_founding', 'Gründungskosten (Notar, Anmeldung, Beratung)', false],
  ['inv_launch', 'Markteinführung (Werbung zum Start)', false],
];
export const COST_KEYS = [
  ['c_rent', 'Miete inkl. Nebenkosten'],
  ['c_utilities', 'Energie, Wasser'],
  ['c_insurance', 'Versicherungen, Beiträge (IHK/HWK)'],
  ['c_marketing', 'Marketing, Werbung'],
  ['c_vehicle', 'Kfz-Kosten'],
  ['c_it_phone', 'Telefon, Internet, Software'],
  ['c_accounting', 'Buchhaltung, Steuerberatung'],
  ['c_other', 'Sonstige Kosten'],
];

function productLines(sub, p, vatFactor, isNet) {
  const raw = [1, 2, 3].map((i) => ({
    name: p[`p${i}_name`] || `Angebot ${i}`, price: n(p[`p${i}_price`]), cost: n(p[`p${i}_cost`]), share: n(p[`p${i}_share`]),
  })).filter((l) => l.price !== null);
  const lines = raw.length ? raw : (n(sub.price) !== null ? [{ name: 'Durchschnittlicher Verkauf', price: n(sub.price), cost: z(sub.unit_cost), share: 100 }] : []);
  if (!lines.length) return null;
  const shareSum = sum(lines.map((l) => l.share ?? 0));
  for (const l of lines) {
    l.w = shareSum > 0 ? (l.share ?? 0) / shareSum : 1 / lines.length;
    l.cost = l.cost ?? 0;
    l.net = isNet ? l.price : l.price * vatFactor;
  }
  return lines;
}

/** @returns {{ok:boolean, missing:string[], assumptions:string[], warnings:string[], v:object}} */
export function buildPlan(sub, p, vatKey = suggestVat(sub)) {
  const A = PLAN_ASSUMPTIONS, assumptions = [], warnings = [], missing = [];
  const vat = VAT_OPTIONS[vatKey] || VAT_OPTIONS.std19;
  const isNet = sub.price_is_net === true || sub.price_is_net === 'true';

  const lines = productLines(sub, p, vat.factor, isNet);
  if (!lines) missing.push('fiyat (ürün/hizmet satırı)');
  const u1 = n(p.units_m1), u12 = n(p.units_m12);
  if (u1 === null) missing.push('1. ay beklenen satış adedi');
  if (u12 === null) missing.push('12. ay beklenen satış adedi');
  if (missing.length) return { ok: false, missing, assumptions, warnings, v: {} };

  const priceNet = sum(lines.map((l) => l.net * l.w));
  const unitCost = sum(lines.map((l) => l.cost * l.w));
  if (!isNet && vatKey !== 'none') assumptions.push(`Brüt fiyatlar nete çevrildi: ${vat.label}.`);
  if (lines.length > 1) assumptions.push(`Satış karması: ${lines.map((l) => `${l.name} %${Math.round(l.w * 100)}`).join(', ')}.`);

  const g2 = z(p.growth_y2) / 100, g3 = z(p.growth_y3) / 100;
  const units = [];
  for (let m = 1; m <= 36; m++) {
    if (m <= 12) units.push(u1 + (u12 - u1) * (m - 1) / 11);
    else if (m <= 24) units.push(u12 * (1 + g2));
    else units.push(u12 * (1 + g2) * (1 + g3));
  }
  assumptions.push('Satış 1. aydan 12. aya doğrusal artıyor; 2. ve 3. yılda yıllık büyüme oranıyla sabit. Mevsimsellik yok.');

  // Kosten
  const costs = Object.fromEntries(COST_KEYS.map(([k]) => [k, z(p[k])]));
  if (n(p.c_rent) === null && n(sub.rent) !== null) { costs.c_rent = n(sub.rent); assumptions.push('Kira, denetim formundaki değerden alındı.'); }
  const costSum = sum(Object.values(costs));
  if (costSum === 0 && n(sub.fixed_costs) !== null) {
    costs.c_other = n(sub.fixed_costs);
    assumptions.push('Gider kalemleri girilmedi; denetim formundaki aylık sabit gider "Sonstige" olarak alındı.');
  }
  const fixedMonthly = sum(Object.values(costs));
  const staffGross = z(p.c_staff_gross);
  const staffMonthly = staffGross * (1 + A.employer_share);
  if (staffGross > 0) assumptions.push(`Personel: brüt maaşa %${Math.round(A.employer_share * 100)} işveren payı eklendi.`);

  // Investitionen
  const inv = Object.fromEntries(INV_KEYS.map(([k]) => [k, z(p[k])]));
  if (sum(Object.values(inv)) === 0 && n(sub.investment) !== null) {
    inv.inv_equipment = n(sub.investment);
    assumptions.push('Yatırım kalemleri girilmedi; denetim formundaki kuruluş yatırımı "Einrichtung" olarak alındı.');
  }
  const invTotal = sum(Object.values(inv));
  const depreciable = sum(INV_KEYS.filter(([, , d]) => d).map(([k]) => inv[k]));
  const depMonthly = depreciable / (A.depreciation_years * 12);
  const oneOffExpense = inv.inv_founding + inv.inv_launch;
  if (depreciable > 0) assumptions.push(`Amortisman (AfA): demirbaş ${A.depreciation_years} yılda doğrusal (ortalama varsayım; gerçek süreler AfA-Tabelle'ye göre değişir).`);

  // Privat
  let living = n(p.pv_living) ?? n(sub.personal_need);
  if (living === null) { living = 2000; assumptions.push('Kişisel yaşam gideri 2.000 €/ay varsayıldı.'); }
  const health = z(p.pv_health), pension = z(p.pv_pension), otherIncome = z(p.pv_other_income);
  const withdrawal = Math.max(0, living + health + pension - otherIncome);
  if (health === 0) warnings.push('Sağlık sigortası (KV/PV) ayrıca girilmedi; serbest çalışanlar bunu kendileri öder, yaşam giderine dahil olduğundan emin ol.');

  // Finanzierung
  const equity = n(p.f_equity);
  if (equity === null) assumptions.push('Öz sermaye tam tutarı girilmedi, 0 € alındı.');
  const privLoan = z(p.f_private_loan), privRepay = z(p.f_private_repay);
  const bank = z(p.f_bank_loan), rate = z(p.f_bank_rate) / 100, years = n(p.f_bank_years) ?? 5, grace = Math.min(z(p.f_bank_grace), years * 12 - 1);
  const grants = z(p.f_grants);
  const gz = (p.gz_apply === 'yes' || p.gz_apply === true) && n(p.alg1_monthly) !== null;
  if (p.gz_apply === 'yes' && n(p.alg1_monthly) === null) warnings.push('Gründungszuschuss isteniyor ama aylık ALG I tutarı girilmedi; plana eklenmedi.');
  if (gz && sub.situation !== 'alg1') warnings.push('Gründungszuschuss planlanmış ama denetim formunda durum "ALG I" değil; uygunluk kontrol edilmeli.');
  if (gz) assumptions.push(`Gründungszuschuss faz 1: ${A.gz_months} ay × (ALG I + ${A.gz_bonus} €). Faz 2 (9 ay × 300 €) takdire bağlı, plana konmadı.`);
  if (bank > 0 && rate === 0) warnings.push('Kredi tutarı var ama faiz oranı girilmedi; faiz 0 alındı.');

  const lag = (sub.customers === 'b2b' || sub.customers === 'both') ? Math.round(z(p.payment_days) / 30) : 0;
  if (lag > 0) assumptions.push(`Tahsilat gecikmesi: satışlar ${lag} ay sonra kasaya giriyor (ödeme vadesi ${z(p.payment_days)} gün).`);
  assumptions.push('Mal alımı satışla aynı ayda ödeniyor. KDV nakit akışında nötr (tahsil edilen = ödenen) kabul edildi.');
  assumptions.push('Gelir vergisi ve Gewerbesteuer hesaba katılmadı: sonuçlar vergi öncesidir. Vergi yükü Steuerberater ile netleştirilmeli.');
  if (sub.founders && sub.founders !== '1') assumptions.push('Birden fazla kurucu: özel çekişler tek kurucu için girilen tutardır; diğer kurucular ayrıca eklenmeli.');

  // Monat für Monat
  const months = [];
  let bankBal = bank, cash = (equity ?? 0) + privLoan + bank + grants - invTotal;
  let opCum = -invTotal, opMin = -invTotal, opMinMonth = 0;
  let cashMin = cash, cashMinMonth = 0;
  const amortMonths = years * 12 - grace;
  const tilgungRate = bank > 0 ? bank / amortMonths : 0;
  const revenueByMonth = [];
  for (let m = 1; m <= 36; m++) {
    const revenue = units[m - 1] * priceNet;
    revenueByMonth.push(revenue);
    const cogs = units[m - 1] * unitCost;
    const interest = bankBal * rate / 12;
    const tilgung = m > grace ? Math.min(tilgungRate, bankBal) : 0;
    const oneOff = m === 1 ? oneOffExpense : 0;
    const ebt = revenue - cogs - staffMonthly - fixedMonthly - depMonthly - oneOff - interest;
    const received = m > lag ? revenueByMonth[m - 1 - lag] : 0;
    const gzIn = gz && m <= A.gz_months ? n(p.alg1_monthly) + A.gz_bonus : 0;
    const repay = Math.min(privRepay, Math.max(0, privLoan - sum(months.map((x) => x.repay))));
    const opFlow = received - cogs - staffMonthly - fixedMonthly - withdrawal + gzIn;
    const outTotal = cogs + staffMonthly + fixedMonthly + interest + tilgung + repay + withdrawal;
    cash += received + gzIn - outTotal;
    bankBal -= tilgung;
    opCum += opFlow;
    if (opCum < opMin) { opMin = opCum; opMinMonth = m; }
    if (cash < cashMin) { cashMin = cash; cashMinMonth = m; }
    months.push({ m, units: units[m - 1], revenue, cogs, staff: staffMonthly, fixed: fixedMonthly, dep: depMonthly, oneOff, interest, ebt,
      received, gzIn, tilgung, repay, withdrawal, inflow: received + gzIn, outflow: outTotal, cash });
  }

  const year = (y) => {
    const s = months.slice((y - 1) * 12, y * 12), t = (k) => sum(s.map((x) => x[k]));
    const r = { revenue: t('revenue'), cogs: t('cogs'), staff: t('staff'), fixed: t('fixed'), dep: t('dep'), oneOff: t('oneOff'), interest: t('interest'),
      ebt: t('ebt'), withdrawal: t('withdrawal'), tilgung: t('tilgung'), repay: t('repay'), units: t('units') };
    r.gross = r.revenue - r.cogs;
    r.afterWithdrawal = r.ebt - r.withdrawal;
    r.debtService = r.ebt + r.dep - r.withdrawal - r.tilgung - r.repay; // Kapitaldienst-Überschuss
    r.cashEnd = s[s.length - 1].cash;
    return r;
  };
  const years3 = [year(1), year(2), year(3)];

  const reserve = A.reserve_months * (fixedMonthly + staffMonthly + withdrawal);
  const startDeficit = Math.max(0, -(opMin + invTotal)); // laufende Anlaufverluste ohne Investitionen
  const capitalNeed = invTotal + startDeficit + reserve;
  const funding = (equity ?? 0) + privLoan + bank + grants;
  const beMonth = months.find((x) => x.ebt >= x.withdrawal)?.m ?? null;

  if (cashMin < 0) warnings.push(`Kasa ${cashMinMonth}. ayda ${fmt(cashMin)} € ile eksiye düşüyor: finansman yetersiz.`);
  if (funding < capitalNeed) warnings.push(`Kapitalbedarf (rezerv dahil) ${fmt(capitalNeed)} €, finansman ${fmt(funding)} €: ${fmt(capitalNeed - funding)} € açık.`);
  if (beMonth === null) warnings.push('36 ay içinde hiçbir ay vergi öncesi kâr kişisel çekişleri karşılamıyor. Bu durumda "Anlaufverluste" 36 ayın toplam açığıdır ve plan bu haliyle bankaya/Arbeitsagentur\'a sunulabilir değildir: önce model (fiyat, maliyet, satış hedefi) değişmeli.');
  if (years3[2].debtService < 0) warnings.push('3. yılda kredi ödemesi ve çekişlerden sonra nakit fazlası negatif: Kapitaldienstfähigkeit zayıf.');
  if (priceNet <= unitCost) warnings.push('Ortalama net fiyat birim maliyetin altında.');

  const v = { lines, priceNet, unitCost, units, fixedMonthly, costs, staffMonthly, staffGross, staffCount: z(p.c_staff_count), inv, invTotal, depMonthly, oneOffExpense,
    living, health, pension, otherIncome, withdrawal, equity: equity ?? 0, privLoan, privRepay, bank, rate, years, grace, grants, gz, alg1: n(p.alg1_monthly),
    lag, months, years3, reserve, startDeficit, capitalNeed, funding, gap: capitalNeed - funding, cashMin, cashMinMonth, opMinMonth, beMonth,
    start: p.start_month || null };
  return { ok: true, missing, assumptions, warnings, v };
}

// ---------- Ausgabe ----------
const e = (x) => fmt(x);
const row = (cells) => `| ${cells.join(' | ')} |`;
const sep = (k) => row(Array(k).fill('---'));

function monthLabel(start, m) {
  if (!start || !/^\d{4}-\d{2}$/.test(start)) return `M${m}`;
  const [y, mo] = start.split('-').map(Number), d = new Date(y, mo - 1 + m - 1, 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Claude'a verilecek blok: Almanca tablolar, Türkçe yönlendirme. */
export function planToText(res) {
  if (!res.ok) return `FİNANS PLANI: hesaplanamadı, eksik: ${res.missing.join(', ')}.`;
  const v = res.v, Y = v.years3, L = [];
  L.push('FİNANS PLANI (kodla hesaplandı — tabloları AYNEN kullan, yeniden hesaplama)');
  L.push('', '### Kapitalbedarfsplan', row(['Position', 'Betrag (€)']), sep(2));
  for (const [k, label] of INV_KEYS) if (v.inv[k]) L.push(row([label, e(v.inv[k])]));
  L.push(row(['Anlaufverluste bis zur Tragfähigkeit (inkl. Privatentnahmen)', e(v.startDeficit)]));
  L.push(row([`Liquiditätsreserve (${PLAN_ASSUMPTIONS.reserve_months} Monate laufende Auszahlungen)`, e(v.reserve)]));
  L.push(row(['**Kapitalbedarf gesamt**', `**${e(v.capitalNeed)}**`]));
  L.push('', '### Finanzierungsplan', row(['Quelle', 'Betrag (€)']), sep(2));
  L.push(row(['Eigenkapital', e(v.equity)]));
  if (v.privLoan) L.push(row(['Privatdarlehen (Familie)', e(v.privLoan)]));
  if (v.bank) L.push(row([`Bankdarlehen (${fmt(v.rate * 100, 2)} % p. a., ${v.years} Jahre, ${v.grace} Monate tilgungsfrei)`, e(v.bank)]));
  if (v.grants) L.push(row(['Zuschüsse', e(v.grants)]));
  L.push(row(['**Finanzierung gesamt**', `**${e(v.funding)}**`]));
  L.push(row([v.gap > 0 ? '**Finanzierungslücke**' : 'Überdeckung', e(Math.abs(v.gap))]));
  if (v.gz) L.push(`Zusätzlich Gründungszuschuss Phase 1: ${PLAN_ASSUMPTIONS.gz_months} × ${e(v.alg1 + PLAN_ASSUMPTIONS.gz_bonus)} € = ${e(PLAN_ASSUMPTIONS.gz_months * (v.alg1 + PLAN_ASSUMPTIONS.gz_bonus))} € (in der Liquiditätsplanung als Einzahlung enthalten).`);

  L.push('', '### Umsatzplanung', row(['Angebot', 'Preis brutto (€)', 'Preis netto (€)', 'Wareneinsatz/Stück (€)', 'Anteil']), sep(5));
  for (const l of v.lines) L.push(row([l.name, fmt(l.price, 2), fmt(l.net, 2), fmt(l.cost, 2), `${Math.round(l.w * 100)} %`]));
  L.push(`Verkäufe pro Monat: Monat 1 ${e(v.units[0])}, Monat 12 ${e(v.units[11])}, Jahr 2 ${e(v.units[12])}, Jahr 3 ${e(v.units[24])}.`);

  L.push('', '### Rentabilitätsvorschau (vor Steuern)', row(['Position (€)', 'Jahr 1', 'Jahr 2', 'Jahr 3']), sep(4));
  const yr = (label, k, bold) => L.push(row([bold ? `**${label}**` : label, ...Y.map((y) => (bold ? `**${e(y[k])}**` : e(y[k])))]));
  yr('Umsatz (netto)', 'revenue'); yr('− Wareneinsatz', 'cogs'); yr('= Rohertrag', 'gross', true);
  if (v.staffMonthly) yr('− Personalkosten', 'staff');
  yr('− Sachkosten (Miete, Versicherung, Marketing …)', 'fixed');
  if (v.depMonthly) yr('− Abschreibungen', 'dep');
  if (v.oneOffExpense) yr('− Gründungs- und Startkosten', 'oneOff');
  if (v.bank) yr('− Zinsen', 'interest');
  yr('= Ergebnis vor Steuern', 'ebt', true);
  yr('− Privatentnahmen', 'withdrawal');
  yr('= Überschuss nach Entnahmen (vor Steuern)', 'afterWithdrawal', true);
  if (v.bank || v.privRepay) { yr('− Tilgung', 'tilgung'); }
  yr('Kapitaldienst-Überschuss (Ergebnis + AfA − Entnahmen − Tilgung)', 'debtService');

  L.push('', '### Sachkosten pro Monat', row(['Position', '€/Monat']), sep(2));
  for (const [k, label] of COST_KEYS) if (v.costs[k]) L.push(row([label, e(v.costs[k])]));
  if (v.staffMonthly) L.push(row([`Personal (${v.staffCount || '?'} Personen, brutto ${e(v.staffGross)} € + AG-Anteil)`, e(v.staffMonthly)]));

  L.push('', '### Privatentnahmen pro Monat', row(['Position', '€/Monat']), sep(2));
  L.push(row(['Lebenshaltung', e(v.living)]));
  if (v.health) L.push(row(['Kranken- und Pflegeversicherung', e(v.health)]));
  if (v.pension) L.push(row(['Altersvorsorge', e(v.pension)]));
  if (v.otherIncome) L.push(row(['− andere Einkünfte (Partner, Nebenjob)', e(v.otherIncome)]));
  L.push(row(['**Entnahmebedarf**', `**${e(v.withdrawal)}**`]));

  L.push('', '### Liquiditätsplan Jahr 1', row(['Monat', 'Einzahlungen', 'Auszahlungen', 'Saldo', 'Kontostand']), sep(5));
  L.push(row(['Start', '', `${e(v.invTotal)} (Investitionen)`, '', e(v.funding - v.invTotal)]));
  for (const x of v.months.slice(0, 12)) L.push(row([monthLabel(v.start, x.m), e(x.inflow), e(x.outflow), e(x.inflow - x.outflow), e(x.cash)]));
  L.push('', '### Liquiditätsplan Jahr 2–3 (Quartale)', row(['Quartal', 'Einzahlungen', 'Auszahlungen', 'Saldo', 'Kontostand Ende']), sep(5));
  for (let q = 4; q < 12; q++) {
    const s = v.months.slice(q * 3, q * 3 + 3), i = sum(s.map((x) => x.inflow)), o = sum(s.map((x) => x.outflow));
    L.push(row([`J${Math.floor(q / 4) + 1} Q${(q % 4) + 1}`, e(i), e(o), e(i - o), e(s[2].cash)]));
  }

  L.push('', 'GÖSTERGELER');
  L.push(`- Ortalama net fiyat ${fmt(v.priceNet, 2)} €, ortalama birim maliyet ${fmt(v.unitCost, 2)} €`);
  L.push(`- Vergi öncesi kârın kişisel çekişleri ilk karşıladığı ay: ${v.beMonth ? `${v.beMonth}. ay (${monthLabel(v.start, v.beMonth)})` : '36 ay içinde yok'}`);
  L.push(`- En düşük kasa: ${e(v.cashMin)} € (${v.cashMinMonth ? `${v.cashMinMonth}. ay` : 'başlangıç'})`);
  L.push(`- 3. yıl sonu kasa: ${e(Y[2].cashEnd)} €`);
  if (res.warnings.length) { L.push('UYARILAR:'); res.warnings.forEach((w) => L.push(`- ${w}`)); }
  if (res.assumptions.length) { L.push('VARSAYIMLAR (planda "Annahmen" bölümüne yaz):'); res.assumptions.forEach((a) => L.push(`- ${a}`)); }
  return L.join('\n');
}

/** 36 aylık ayrıntı, Excel'e açılabilir CSV (noktalı virgül, Alman ondalık). */
export function planToCsv(res) {
  if (!res.ok) return '';
  const v = res.v, c = (x) => (typeof x === 'number' ? x.toFixed(2).replace('.', ',') : `"${String(x).replace(/"/g, '""')}"`);
  const head = ['Monat', 'Verkäufe', 'Umsatz netto', 'Wareneinsatz', 'Personal', 'Sachkosten', 'AfA', 'Gründung/Start', 'Zinsen', 'Ergebnis vor Steuern',
    'Einzahlung Umsatz', 'Gründungszuschuss', 'Tilgung', 'Rückzahlung privat', 'Privatentnahme', 'Einzahlungen', 'Auszahlungen', 'Kontostand'];
  const rows = v.months.map((x) => [monthLabel(v.start, x.m), x.units, x.revenue, x.cogs, x.staff, x.fixed, x.dep, x.oneOff, x.interest, x.ebt,
    x.received, x.gzIn, x.tilgung, x.repay, x.withdrawal, x.inflow, x.outflow, x.cash]);
  return '﻿' + [head, ...rows].map((r) => r.map(c).join(';')).join('\r\n');
}
