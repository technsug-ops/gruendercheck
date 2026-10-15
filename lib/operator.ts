// İşletmeci bilgileri (Impressum, Datenschutz). Tek kaynak: adres veya kayıt değişirse sadece burası.
// (Rapor alt bilgisi lib/report/render.ts L.*.foot ve e-posta alt bilgisi lib/mail.ts kısa biçimi ayrıca içerir.)
export const OPERATOR = {
  company: "TechNS UG (haftungsbeschränkt)",
  address: "Ludwig-Erhard-Str. 16A, 61440 Oberursel (Taunus), Deutschland",
  register: "Amtsgericht Bad Homburg, HRB 16236",
  vat: "USt-IdNr. DE312006599",
  ceo: "Geschäftsführer: Halil Yaprakli",
  phone: "+49 6171 277 51 37",
  email: "info@dgitmarkt.de",
} as const;

/** Tanıtım sayfası v1'de adresi ülke olmadan gösteriyordu. */
export const OPERATOR_SHORT_ADDRESS = { ...OPERATOR, address: OPERATOR.address.replace(/, Deutschland$/, "") } as const;
