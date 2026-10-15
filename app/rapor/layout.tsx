import type { Metadata } from "next";

// Rapor önizleme / PDF sayfası (yönetici aracı) kendi kök düzenine sahip. v1: legacy/rapor.html <head>.
export const metadata: Metadata = { title: "Rapor PDF", robots: { index: false, follow: false } };

export default function RaporLayout({ children }: LayoutProps<"/rapor">) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
