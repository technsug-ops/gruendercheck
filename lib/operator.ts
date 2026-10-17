// İşletmeci bilgileri (Impressum, Datenschutz, e-posta ve rapor alt bilgisi). Tek kaynak: adres veya kayıt değişirse
// sadece burası. Sadece veri; etiketler ("Geschäftsführer", "Telefon" …) messages/<dil>/common.json → legal.
const street = "Ludwig-Erhard-Str. 16A";
const zipTown = "61440 Oberursel";

export const OPERATOR = {
  company: "TechNS UG (haftungsbeschränkt)",
  companyShort: "TechNS UG",
  street,
  zipTown,
  address: `${street}, ${zipTown} (Taunus), Deutschland`,
  register: "Amtsgericht Bad Homburg, HRB 16236",
  vatId: "DE312006599",
  ceoName: "Halil Yaprakli",
  phone: "+49 6171 277 51 37",
  email: "info@dgitmarkt.de",
} as const;

/** Tanıtım sayfası v1'de adresi ülke olmadan gösteriyordu. */
export const OPERATOR_SHORT_ADDRESS = { ...OPERATOR, address: `${street}, ${zipTown} (Taunus)` } as const;

type Key = keyof typeof OPERATOR;
/** Metinlerdeki {company}, {street} … yer tutucularını işletmeci verisiyle doldurur (ICU kullanılmayan yerler için). */
export const fillOperator = (s: string) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (Object.hasOwn(OPERATOR, k) ? OPERATOR[k as Key] : m));
